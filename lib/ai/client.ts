export interface AiMediaItem {
  id: string;
  title: string;
  originalTitle?: string | null;
  mediaType: string;
  genres: string[];
  creators?: string[];
  cast?: string[];
  tags?: string[];
  description?: string | null;
  year?: number | null;
  averageRating?: number | null;
  popularity?: number | null;
  posterUrl?: string | null;
  runtime?: number | null;
  contentRating?: string | null;
}

export interface AiUserInteraction {
  mediaId: string;
  rating?: number | null;
  status?: string | null;
  isFavorite?: boolean;
  watchedAt?: string | null;
}

export interface AiUserProfile {
  userId: string;
  favoriteGenres: string[];
  favoriteCreators?: string[];
  interactions: AiUserInteraction[];
}

export interface AiRecommendationFactors {
  contentSimilarity: number;
  qualityScore: number;
  popularityScore: number;
  diversityBonus: number;
  predictedRating?: number;
  polarityAdjustment?: number;
}

export interface AiRecommendationResult {
  mediaId: string;
  matchPercentage: number;
  score: number;
  reason: string;
  factors?: AiRecommendationFactors;
}

export interface AiSimilarResult {
  mediaId: string;
  similarityScore: number;
  matchPercentage: number;
  sharedGenres: string[];
  sharedCreators?: string[];
  eraMatch?: boolean;
}

export interface AiTasteMatchFactorBreakdown {
  ratingCorrelation: number;
  genreSimilarity: number;
  librarySynergy: number;
  consensusScore: number;
}

export interface AiTasteMatchResult {
  score: number;
  commonGenres: string[];
  divergentGenres?: string[];
  tasteArchetype?: string;
  compatibilitySummary: string;
  factors?: AiTasteMatchFactorBreakdown;
}

const AI_ENGINE_BASE_URL = process.env.AI_ENGINE_URL || "http://127.0.0.1:8001";

/**
 * Checks if the Python AI microservice is reachable and healthy.
 */
export async function checkAiEngineHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${AI_ENGINE_BASE_URL}/health`, {
      signal: AbortSignal.timeout(400),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Request ML personalized recommendations for a user.
 */
export async function getAiUserRecommendations(
  user: AiUserProfile,
  candidates: AiMediaItem[],
  topK: number = 12,
  options?: { useMmr?: boolean; mmrLambda?: number }
): Promise<AiRecommendationResult[] | null> {
  try {
    const res = await fetch(`${AI_ENGINE_BASE_URL}/recommend/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user,
        candidates,
        topK,
        useMmr: options?.useMmr ?? true,
        mmrLambda: options?.mmrLambda ?? 0.75,
      }),
      signal: AbortSignal.timeout(1000),
      cache: "no-store",
    });

    if (!res.ok) return null;
    return (await res.json()) as AiRecommendationResult[];
  } catch {
    // Graceful fallback if AI engine is offline
    return null;
  }
}

/**
 * Request ML item-to-item semantic similarity for media details.
 */
export async function getAiSimilarMedia(
  target: AiMediaItem,
  candidates: AiMediaItem[],
  topK: number = 8
): Promise<AiSimilarResult[] | null> {
  try {
    const res = await fetch(`${AI_ENGINE_BASE_URL}/recommend/similar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, candidates, topK }),
      signal: AbortSignal.timeout(800),
      cache: "no-store",
    });

    if (!res.ok) return null;
    return (await res.json()) as AiSimilarResult[];
  } catch {
    // Graceful fallback if AI engine is offline
    return null;
  }
}

/**
 * Request ML taste compatibility between two user profiles.
 */
export async function getAiTasteMatch(
  user1: AiUserProfile,
  user2: AiUserProfile
): Promise<AiTasteMatchResult | null> {
  try {
    const res = await fetch(`${AI_ENGINE_BASE_URL}/recommend/taste-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user1, user2 }),
      signal: AbortSignal.timeout(800),
      cache: "no-store",
    });

    if (!res.ok) return null;
    return (await res.json()) as AiTasteMatchResult;
  } catch {
    return null;
  }
}
