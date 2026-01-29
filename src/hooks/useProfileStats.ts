// ABOUTME: Hook for fetching profile statistics from Funnelcake REST API with WebSocket fallback
// ABOUTME: Aggregates data from REST API for speed, falls back to WebSocket when unavailable

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { ProfileStats } from '@/components/ProfileHeader';
import { debugLog } from '@/lib/debug';
import type { ParsedVideoData } from '@/types/video';
import { API_CONFIG } from '@/config/api';
import { fetchUserProfile } from '@/lib/funnelcakeClient';
import { isFunnelcakeAvailable } from '@/lib/funnelcakeHealth';

/**
 * Fetch comprehensive profile statistics for a user
 * Uses Funnelcake REST API when available for fast response,
 * falls back to WebSocket queries when Funnelcake is unavailable
 */
export function useProfileStats(pubkey: string, videos?: ParsedVideoData[]) {
  const { nostr } = useNostr();
  const apiUrl = API_CONFIG.funnelcake.baseUrl;

  return useQuery({
    queryKey: ['profile-stats-v2', pubkey, videos?.length || 0],
    queryFn: async (context) => {
      if (!pubkey) throw new Error('No pubkey provided');

      const signal = AbortSignal.any([context.signal, AbortSignal.timeout(10000)]);

      // Calculate video-based stats from provided videos array
      // These are always computed locally regardless of API source
      const videosCount = videos?.length || 0;
      const originalLoopCount = videos?.reduce((sum, v) => sum + (v.loopCount || 0), 0) || 0;
      const isClassicViner = originalLoopCount > 0;

      if (isClassicViner) {
        debugLog(`[useProfileStats] Classic Viner detected with ${originalLoopCount} original loops`);
      }

      // Try Funnelcake REST API first (much faster than WebSocket)
      if (isFunnelcakeAvailable(apiUrl)) {
        try {
          debugLog(`[useProfileStats] Using Funnelcake REST API for ${pubkey}`);
          const profile = await fetchUserProfile(apiUrl, pubkey, signal);

          if (profile) {
            // Calculate total views from videos if available, otherwise use API reactions
            let totalViews = 0;
            if (videos && videos.length > 0) {
              totalViews = videos.reduce((sum, v) => sum + (v.likeCount || 0), 0);
            } else {
              totalViews = profile.total_reactions || 0;
            }

            const stats: ProfileStats = {
              videosCount,
              totalViews,
              joinedDate: null, // REST API doesn't provide this yet
              followersCount: profile.follower_count || 0,
              followingCount: profile.following_count || 0,
              originalLoopCount: isClassicViner ? originalLoopCount : undefined,
              isClassicViner,
            };

            debugLog(`[useProfileStats] REST API success: ${stats.followersCount} followers`);
            return stats;
          }
        } catch (err) {
          debugLog(`[useProfileStats] REST API failed, falling back to WebSocket:`, err);
          // Fall through to WebSocket fallback
        }
      }

      // WebSocket fallback - original implementation
      debugLog(`[useProfileStats] Using WebSocket fallback for ${pubkey}`);

      try {
        // Query contact list for social metrics
        const allEvents = await nostr.query([
          {
            kinds: [3],
            authors: [pubkey],
            limit: 1,
          }
        ], { signal });

        const userContactList = allEvents.filter(e => e.kind === 3 && e.pubkey === pubkey);

        // Get video IDs for social metrics calculation
        const videoIds = videos?.map(v => v.id) || [];

        // Fetch social interactions for all videos
        let totalViews = 0;
        if (videoIds.length > 0) {
          const socialInteractions = await nostr.query([{
            kinds: [6, 7, 9735], // reposts, reactions, zap receipts
            '#e': videoIds, // Events referencing user's videos
            limit: 2000, // Large limit to capture all interactions
          }], { signal });

          // Calculate total views (likes + reposts + zaps as proxy for engagement)
          totalViews = socialInteractions.filter(event => {
            return (
              event.kind === 7 && (event.content === '+' || event.content === '❤️' || event.content === '👍') ||
              event.kind === 6 ||
              event.kind === 9735
            );
          }).length;
        }

        // Query follower count with much higher limit across multiple relays
        debugLog(`[useProfileStats] Querying followers for ${pubkey}`);

        const followerEvents = await nostr.query([{
          kinds: [3],
          '#p': [pubkey],
          limit: 10000, // Large limit to capture more followers
        }], { signal });

        // Calculate follower count (unique pubkeys following this user)
        const followerPubkeys = new Set(followerEvents.map(event => event.pubkey));
        const followersCount = followerPubkeys.size;

        debugLog(`[useProfileStats] Found ${followerEvents.length} follower events, ${followersCount} unique followers`);

        // Calculate following count (people this user follows)
        const latestContactList = userContactList
          .sort((a, b) => b.created_at - a.created_at)[0];

        const followingCount = latestContactList
          ? latestContactList.tags.filter(tag => tag[0] === 'p').length
          : 0;

        // Calculate joined date (earliest video or contact list)
        let joinedDate: Date | null = null;
        if (userContactList.length > 0) {
          const earliestTimestamp = Math.min(...userContactList.map(event => event.created_at));
          joinedDate = new Date(earliestTimestamp * 1000);
        }

        const stats: ProfileStats = {
          videosCount,
          totalViews,
          joinedDate,
          followersCount,
          followingCount,
          originalLoopCount: isClassicViner ? originalLoopCount : undefined,
          isClassicViner,
        };

        return stats;
      } catch (error) {
        console.error('Failed to fetch profile stats:', error);
        // Return default stats on error
        return {
          videosCount,
          totalViews: 0,
          joinedDate: null,
          followersCount: 0,
          followingCount: 0,
          originalLoopCount: isClassicViner ? originalLoopCount : undefined,
          isClassicViner,
        } as ProfileStats;
      }
    },
    enabled: !!pubkey,
    staleTime: 60000, // Consider data stale after 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: 2,
  });
}
