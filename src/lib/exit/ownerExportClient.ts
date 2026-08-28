// ABOUTME: Walks Divine's owner-export endpoint with NIP-98 auth and opaque cursors
// ABOUTME: Surfaces typed failures so the /exit/start page can explain what went wrong

import type { NostrSigner } from "@nostrify/nostrify";

import { walkExportCursor, type CursorWalkProgress } from "./cursorWalk";
import { exportRetryDelayMs, readExportErrorBody, signedExportGet, validateExportPage, type ExportPage } from "./exportTransport";
import { isHex64 } from "./hex";
import {
  dropOrphanAnnotations,
  parseAnnotations,
  parseWithheld,
  type AnnotationMetadata,
  type AnnotationStatus,
  type ModerationAnnotation,
  type WithheldResult
} from "./moderationMetadata";

export type { ExportPage } from "./exportTransport";
export type ExportProgress = CursorWalkProgress;

interface OwnerExportPage extends ExportPage {
  moderationAnnotations: AnnotationMetadata;
  withheld: WithheldResult;
}

export type ExportFailureCode = "invalid-pubkey" | "bad-cursor" | "expired-cursor" | "auth-required" | "pubkey-mismatch" | "rate-limited" | "server-failure" | "malformed-response" | "network-failure" | "cancelled" | "stalled-cursor" | "page-limit";

export interface OwnerExportPageResponse {
  data: ExportPage["data"];
  moderation_annotations?: Record<string, { status: AnnotationStatus }>;
  withheld?: { complete: false } | { complete: true; count: number };
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
  };
}

export class OwnerExportError extends Error {
  constructor(public readonly code: ExportFailureCode, message: string, public readonly status?: number, public readonly retryAfterMs?: number) {
    super(message);
    this.name = "OwnerExportError";
  }
}

export interface OwnerExportModeration {
  annotations: ModerationAnnotation[];
  annotationsStatus: "complete" | "incomplete" | "unsupported";
  invalidAnnotationCount: number;
  orphanAnnotationCount: number;
  conflictingAnnotationCount: number;
  withheld: WithheldResult;
}

export interface OwnerExportResult {
  events: ExportPage["data"];
  pageCount: number;
  failures: OwnerExportError[];
  moderation: OwnerExportModeration;
}

export interface OwnerExportClientOptions {
  endpointBase: string; pubkey: string; signer: NostrSigner; limit?: number; fetcher?: typeof fetch;
  sleep?: (ms: number) => Promise<void>; maxRateLimitRetries?: number; maxPages?: number;
  signal?: AbortSignal; onProgress?: (progress: ExportProgress) => void;
}

function ownerFailure(code: "network-failure" | "malformed-response" | "stalled-cursor" | "page-limit", detail?: number) {
  const message = code === "network-failure"
    ? "The export could not reach Divine. Check the connection and try again."
    : code === "malformed-response"
      ? "Divine did not provide the next export page."
      : code === "stalled-cursor"
        ? "Divine stopped moving through the export, so this archive ends where it stopped."
        : `This export stopped after ${detail} pages. Everything read up to that point is included.`;
  return new OwnerExportError(code, message);
}

function buildUrl(endpointBase: string, pubkey: string, limit: number, cursor?: string) {
  const url = new URL(`${endpointBase.replace(/\/$/, "")}/api/users/${pubkey}/export/events`);
  url.searchParams.set("limit", String(limit));
  if (cursor) url.searchParams.set("cursor", cursor);
  return url.toString();
}

function classifyBadRequest(body: string) {
  const normalized = body.toLowerCase();
  if (normalized.includes("expired") || normalized.includes("unknown cursor")) return new OwnerExportError("expired-cursor", "The export page expired. Start the export again.", 400);
  if (normalized.includes("cursor")) return new OwnerExportError("bad-cursor", "The export page token was not accepted.", 400);
  return new OwnerExportError("invalid-pubkey", "The account identifier is not valid.", 400);
}

function malformedMessage(detail: string) {
  if (detail === "event identifier") return "Divine returned an event identifier this tool could not read.";
  if (detail === "account identifier") return "Divine returned an account identifier this tool could not read.";
  if (detail === "event for a different account") return "Divine returned an event for a different account.";
  if (detail === "event signature") return "Divine returned an event signature this tool could not read.";
  if (detail === "pagination") return "Divine returned pagination this tool could not read.";
  return "Divine returned a response this tool could not read.";
}

async function fetchOwnerPage(input: { url: string; pubkey: string; signer: NostrSigner; fetcher: typeof fetch; signal?: AbortSignal; retryCount: number }): Promise<OwnerExportPage> {
  const response = await signedExportGet({
    ...input,
    authFailure: () => new OwnerExportError("auth-required", "This export could not be signed. If your account is restricted, appeal first. Otherwise sign in again, then restart the export."),
    networkFailure: () => ownerFailure("network-failure"),
    cancelled: () => new OwnerExportError("cancelled", "The export was cancelled."),
  });
  if (response.status === 400) throw classifyBadRequest(await readExportErrorBody(response));
  if (response.status === 401) throw new OwnerExportError("auth-required", "Sign in again, then restart the export.", 401);
  if (response.status === 403) throw new OwnerExportError("pubkey-mismatch", "This sign-in does not match the account being exported.", 403);
  if (response.status === 429) throw new OwnerExportError("rate-limited", "Divine asked this export to slow down. Wait a moment and try again.", 429, exportRetryDelayMs(response, input.retryCount));
  if (!response.ok) throw new OwnerExportError("server-failure", "Divine could not finish this export right now. Try again later.", response.status);
  try {
    const raw = await response.json();
    const page = validateExportPage(raw, input.pubkey, (detail) => new OwnerExportError("malformed-response", malformedMessage(detail)));
    const metadata = raw as { moderation_annotations?: unknown; withheld?: unknown };
    return {
      ...page,
      moderationAnnotations: parseAnnotations(metadata.moderation_annotations),
      withheld: parseWithheld(metadata.withheld),
    };
  } catch (error) {
    if (error instanceof OwnerExportError) throw error;
    throw new OwnerExportError("malformed-response", malformedMessage("response"));
  }
}

export async function exportOwnerEvents(options: OwnerExportClientOptions): Promise<OwnerExportResult> {
  const { endpointBase, pubkey, signer, fetcher = fetch, limit = 500, signal } = options;
  if (!isHex64(pubkey)) throw new OwnerExportError("invalid-pubkey", "The account identifier is not valid.", 400);
  const annotations = new Map<string, AnnotationStatus>();
  let annotationPagesAvailable = 0;
  let annotationPagesUnsupported = 0;
  let invalidAnnotationCount = 0;
  let conflictingAnnotationCount = 0;
  let lastWithheld: WithheldResult = { kind: "unsupported" };

  const result = await walkExportCursor({
    fetchPage: async (cursor, retryCount) => {
      const page = await fetchOwnerPage({ url: buildUrl(endpointBase, pubkey, limit, cursor), pubkey, signer, fetcher, signal, retryCount });
      lastWithheld = page.withheld;
      if (page.moderationAnnotations.kind === "unsupported") {
        annotationPagesUnsupported += 1;
      } else {
        annotationPagesAvailable += 1;
        invalidAnnotationCount += page.moderationAnnotations.invalidCount;
        for (const [eventId, status] of page.moderationAnnotations.annotations) {
          const previous = annotations.get(eventId);
          if (previous && previous !== status) {
            conflictingAnnotationCount += 1;
            continue;
          }
          annotations.set(eventId, status);
        }
      }
      return page;
    },
    isFailure: (error): error is OwnerExportError => error instanceof OwnerExportError,
    makeFailure: ownerFailure,
    makeCancelledFailure: () => new OwnerExportError("cancelled", "The export was cancelled."),
    cancelledCode: "cancelled", rateLimitedCode: "rate-limited", sleep: options.sleep, signal,
    maxRateLimitRetries: options.maxRateLimitRetries, maxPages: options.maxPages, onProgress: options.onProgress,
  });

  const filtered = dropOrphanAnnotations(annotations, new Set(result.events.map((event) => event.id)));
  const annotationsStatus = annotationPagesAvailable === 0
    ? "unsupported"
    : annotationPagesUnsupported > 0 || invalidAnnotationCount > 0 || filtered.orphanCount > 0 || conflictingAnnotationCount > 0
      ? "incomplete"
      : "complete";

  return {
    ...result,
    moderation: {
      annotations: Array.from(filtered.annotations, ([eventId, status]) => ({ eventId, status })),
      annotationsStatus,
      invalidAnnotationCount,
      orphanAnnotationCount: filtered.orphanCount,
      conflictingAnnotationCount,
      withheld: result.failures.length > 0 ? { kind: "unavailable" } : lastWithheld,
    },
  };
}
