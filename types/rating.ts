export type RatingDistributionItem = { rating: number; count: number; percentage: number };
export type MediaRatingSummary = {
  communityAverageRating: number | null;
  weightedRating: number | null;
  ratingCount: number;
  popularityScore: number;
  ratingDistribution: RatingDistributionItem[];
  currentUserRating: { id: string; rating: number } | null;
  tasteMatch?: number | null;
};

export type RatedMedia = {
  id: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  media: { id: string; title: string; posterUrl: string | null; year: number | null; mediaType: string; communityAverageRating: number | null };
};
