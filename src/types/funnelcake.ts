// ABOUTME: TypeScript types for Funnelcake REST API responses
// ABOUTME: Defines interfaces for video data, search results, and API responses

/**
 * Raw video data from Funnelcake API
 * Note: id and pubkey are hex strings from the API
 */
export interface FunnelcakeVideoRaw {
  id: string;             // Hex string event ID
  pubkey: string;         // Hex string pubkey
  created_at: number;     // Unix timestamp
  kind: number;           // Nostr event kind (34236 for videos)
  d_tag: string;          // Unique identifier for addressable event
  title?: string;         // Video title
  thumbnail?: string;     // Thumbnail URL
  video_url: string;      // Primary video URL
  blurhash?: string;      // Progressive loading placeholder
  author_name?: string;   // Cached author display name
  author_avatar?: string; // Cached author avatar URL
  reactions: number;      // Like count
  comments: number;       // Comment count
  reposts: number;        // Repost count
  engagement_score: number; // Computed engagement metric
  trending_score: number;   // Time-weighted popularity score
  loops: number;          // Original Vine loop count (for classic vines)
  // Platform origin (for filtering classic vines)
  platform?: string;      // 'vine', 'tiktok', etc.
  classic?: boolean;      // Whether this is a classic/archived vine
}

/**
 * Funnelcake API response for video list endpoints
 */
export interface FunnelcakeResponse {
  videos: FunnelcakeVideoRaw[];
  next_cursor?: string;   // Cursor for pagination (timestamp or offset)
  has_more: boolean;      // Whether more results exist
}

/**
 * Video statistics from Funnelcake API
 */
export interface FunnelcakeVideoStats {
  event_id: string;       // Hex event ID
  reactions: number;
  comments: number;
  reposts: number;
  loops: number;
  trending_score: number;
  engagement_score: number;
}

/**
 * Hashtag data from Funnelcake trending hashtags endpoint
 */
export interface FunnelcakeHashtag {
  hashtag: string;        // Hashtag without # prefix
  video_count: number;    // Number of videos with this tag
  videos_24h?: number;    // Videos in last 24 hours
  videos_7d?: number;     // Videos in last 7 days
  unique_creators?: number; // Number of unique creators
  last_used?: number;     // Unix timestamp of last use
  trending_score: number; // Time-weighted popularity
}

/**
 * Classic Viner (popular Vine creator) from Funnelcake API
 */
export interface FunnelcakeViner {
  pubkey: string;         // Hex pubkey
  name?: string;          // Display name
  picture?: string;       // Avatar URL
  total_loops: number;    // Sum of all vine loops
  video_count: number;    // Number of videos
  nip05?: string;         // NIP-05 verification
}

/**
 * Funnelcake API error response
 */
export interface FunnelcakeError {
  error: string;
  code?: string;
  details?: string;
}

/**
 * Options for fetching videos from Funnelcake
 */
export interface FunnelcakeFetchOptions {
  sort?: 'trending' | 'recent' | 'loops' | 'engagement';
  limit?: number;
  before?: string;        // Cursor for pagination (timestamp or offset)
  classic?: boolean;      // Filter for classic/archived vines
  platform?: string;      // Filter by origin platform ('vine', 'tiktok', etc.)
  signal?: AbortSignal;
}

/**
 * Options for searching videos via Funnelcake
 */
export interface FunnelcakeSearchOptions extends FunnelcakeFetchOptions {
  query?: string;         // Text search query
  tag?: string;           // Hashtag filter (without #)
  author?: string;        // Filter by author pubkey
}

/**
 * User feed options for Funnelcake
 */
export interface FunnelcakeUserFeedOptions extends FunnelcakeFetchOptions {
  pubkey: string;         // User pubkey to get feed for
}

/**
 * Funnelcake health status
 */
export interface FunnelcakeHealthStatus {
  available: boolean;
  lastChecked: number;    // Unix timestamp of last health check
  errorCount: number;     // Consecutive error count
  lastError?: string;     // Last error message
}
