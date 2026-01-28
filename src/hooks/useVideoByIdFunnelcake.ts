// ABOUTME: Hook to fetch a single video by ID via Funnelcake REST API
// ABOUTME: Provides fast video lookup for VideoPage with profile context support

import { useQuery } from '@tanstack/react-query';
import { fetchVideoById, fetchUserVideos } from '@/lib/funnelcakeClient';
import { transformFunnelcakeVideo } from '@/lib/funnelcakeTransform';
import { getFunnelcakeUrl, DEFAULT_FUNNELCAKE_URL } from '@/config/relays';
import { useAppContext } from '@/hooks/useAppContext';
import { debugLog } from '@/lib/debug';
import type { ParsedVideoData } from '@/types/video';

interface UseVideoByIdOptions {
  videoId: string;
  pubkey?: string;  // Optional pubkey for faster lookup
  enabled?: boolean;
}

interface UseVideoByIdResult {
  video: ParsedVideoData | null;
  videos: ParsedVideoData[] | null;  // Neighboring videos for navigation
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch a single video by ID via Funnelcake REST API
 *
 * If pubkey is provided, fetches all videos from that user for navigation context.
 * The single video lookup is faster than WebSocket queries.
 */
export function useVideoByIdFunnelcake(options: UseVideoByIdOptions): UseVideoByIdResult {
  const { videoId, pubkey, enabled = true } = options;
  const { config } = useAppContext();

  // Determine API URL from current relay
  const funnelcakeUrl = getFunnelcakeUrl(config.relayUrl) || DEFAULT_FUNNELCAKE_URL;

  // If we have a pubkey, fetch all their videos for navigation context
  const userVideosQuery = useQuery({
    queryKey: ['funnelcake-user-videos', pubkey, funnelcakeUrl],
    queryFn: async ({ signal }) => {
      if (!pubkey) return null;

      debugLog(`[useVideoByIdFunnelcake] Fetching user videos for ${pubkey}`);
      const response = await fetchUserVideos(funnelcakeUrl, pubkey, {
        limit: 100,  // Get all videos for navigation
        signal,
      });

      return response.videos.map(transformFunnelcakeVideo);
    },
    enabled: enabled && !!pubkey,
    staleTime: 300000, // 5 minutes
    gcTime: 900000,    // 15 minutes
  });

  // Single video lookup (used when no pubkey or as fallback)
  const singleVideoQuery = useQuery({
    queryKey: ['funnelcake-video', videoId, funnelcakeUrl],
    queryFn: async ({ signal }) => {
      debugLog(`[useVideoByIdFunnelcake] Fetching single video ${videoId}`);
      const video = await fetchVideoById(funnelcakeUrl, videoId, pubkey, signal);

      if (!video) return null;
      return transformFunnelcakeVideo(video);
    },
    // Only fetch if we don't have pubkey (otherwise userVideosQuery handles it)
    enabled: enabled && !pubkey,
    staleTime: 300000,
    gcTime: 900000,
  });

  // Find the video from the user's videos if we have them
  let video: ParsedVideoData | null = null;
  let videos: ParsedVideoData[] | null = null;

  if (userVideosQuery.data) {
    videos = userVideosQuery.data;
    video = userVideosQuery.data.find(v => v.id === videoId || v.vineId === videoId) || null;
  } else if (singleVideoQuery.data) {
    video = singleVideoQuery.data;
  }

  const isLoading = pubkey
    ? userVideosQuery.isLoading
    : singleVideoQuery.isLoading;

  const error = pubkey
    ? (userVideosQuery.error as Error | null)
    : (singleVideoQuery.error as Error | null);

  return {
    video,
    videos,
    isLoading,
    error,
  };
}
