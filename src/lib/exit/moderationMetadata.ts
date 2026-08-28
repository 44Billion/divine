import { isHex64 } from "./hex";

export type AnnotationStatus = "banned" | "quarantined";

export interface ModerationAnnotation {
  eventId: string;
  status: AnnotationStatus;
}

export type AnnotationMetadata =
  | { kind: "unsupported" }
  | {
      kind: "available";
      annotations: Map<string, AnnotationStatus>;
      invalidCount: number;
    };

export type WithheldResult =
  | { kind: "unsupported" }
  | { kind: "unavailable" }
  | { kind: "known"; count: number };

export interface FilteredAnnotations {
  annotations: Map<string, AnnotationStatus>;
  orphanCount: number;
}

export function parseAnnotations(raw: unknown): AnnotationMetadata {
  if (raw === undefined) {
    return { kind: "unsupported" };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { kind: "available", annotations: new Map(), invalidCount: 1 };
  }

  const annotations = new Map<string, AnnotationStatus>();
  let invalidCount = 0;

  for (const [eventId, value] of Object.entries(raw)) {
    if (!isHex64(eventId) || !value || typeof value !== "object" || Array.isArray(value)) {
      invalidCount += 1;
      continue;
    }

    const status = (value as { status?: unknown }).status;
    if (status !== "banned" && status !== "quarantined") {
      invalidCount += 1;
      continue;
    }
    annotations.set(eventId, status);
  }

  return { kind: "available", annotations, invalidCount };
}

export function parseWithheld(raw: unknown): WithheldResult {
  if (raw === undefined) {
    return { kind: "unsupported" };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { kind: "unavailable" };
  }

  const candidate = raw as { complete?: unknown; count?: unknown };
  if (candidate.complete === false) {
    return { kind: "unavailable" };
  }
  if (
    candidate.complete === true &&
    typeof candidate.count === "number" &&
    Number.isSafeInteger(candidate.count) &&
    candidate.count >= 0
  ) {
    return { kind: "known", count: candidate.count };
  }
  return { kind: "unavailable" };
}

export function dropOrphanAnnotations(
  annotations: Map<string, AnnotationStatus>,
  eventIds: ReadonlySet<string>
): FilteredAnnotations {
  const filtered = new Map<string, AnnotationStatus>();
  let orphanCount = 0;

  for (const [eventId, status] of annotations) {
    if (eventIds.has(eventId)) {
      filtered.set(eventId, status);
    } else {
      orphanCount += 1;
    }
  }

  return { annotations: filtered, orphanCount };
}
