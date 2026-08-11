export type ReviewAuthor = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type ReviewItem = {
  id: string;
  mediaId: string;
  userId: string;
  title: string | null;
  body: string;
  spoiler: boolean;
  visibility: "PUBLIC" | "PRIVATE";
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  author: ReviewAuthor;
  rating: number | null;
};

export type ReviewStats = { total: number; averageUserRating: number | null };
export type PaginatedReviews = {
  items: ReviewItem[];
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  userReview: ReviewItem | null;
  stats: ReviewStats;
};
