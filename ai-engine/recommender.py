import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class MediaItem(BaseModel):
    id: str
    title: str
    originalTitle: Optional[str] = None
    mediaType: str
    genres: List[str] = []
    description: Optional[str] = ""
    year: Optional[int] = None
    averageRating: Optional[float] = None
    popularity: Optional[float] = 0.0
    posterUrl: Optional[str] = None


class UserInteraction(BaseModel):
    mediaId: str
    rating: Optional[float] = None  # 0.5 to 7.0
    status: Optional[str] = None  # WATCHING, COMPLETED, PLAN_TO_WATCH, ON_HOLD, DROPPED
    isFavorite: bool = False


class UserProfile(BaseModel):
    userId: str
    favoriteGenres: List[str] = []
    interactions: List[UserInteraction] = []


class RecommendationResult(BaseModel):
    mediaId: str
    matchPercentage: int  # 0-100
    score: float
    reason: str


class SimilarResult(BaseModel):
    mediaId: str
    similarityScore: float
    matchPercentage: int
    sharedGenres: List[str]


class TasteMatchResult(BaseModel):
    score: int
    commonGenres: List[str]
    compatibilitySummary: str


class HybridRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=5000,
            token_pattern=r"(?u)\b\w+\b",
        )

    def _build_feature_text(self, item: MediaItem) -> str:
        """Create rich weighted text representation of a media item."""
        # Repeat genres 3x to give them higher importance in the TF-IDF feature space
        genre_str = " ".join([f"genre_{g.lower().replace(' ', '_')}" for g in item.genres] * 3)
        type_str = f"type_{item.mediaType.lower()}"
        title_str = f"title_{item.title.lower()} {item.title}"
        desc_str = (item.description or "")[:400]
        return f"{genre_str} {type_str} {title_str} {desc_str}"

    def recommend_for_user(
        self,
        user: UserProfile,
        candidates: List[MediaItem],
        top_k: int = 12,
    ) -> List[RecommendationResult]:
        if not candidates:
            return []

        # Filter out media the user already completed or dropped
        interacted_ids = {i.mediaId: i for i in user.interactions}
        unseen_candidates = [
            c for c in candidates
            if c.id not in interacted_ids or (
                interacted_ids[c.id].status in ["PLAN_TO_WATCH"] and interacted_ids[c.id].rating is None
            )
        ]

        if not unseen_candidates:
            unseen_candidates = candidates

        # 1. Build TF-IDF for all candidate media
        all_items = {c.id: c for c in candidates}
        for interaction in user.interactions:
            # If we have candidate metadata for past interactions, include them
            pass

        corpus = [self._build_feature_text(c) for c in unseen_candidates]
        candidate_ids = [c.id for c in unseen_candidates]

        try:
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
        except Exception:
            # Fallback if corpus is empty or invalid
            return self._fallback_recommendations(user, unseen_candidates, top_k)

        # 2. Build User Taste Preference Vector
        user_vector = np.zeros((1, tfidf_matrix.shape[1]))
        total_weight = 0.0
        anchor_titles = []

        for interaction in user.interactions:
            weight = 1.0
            if interaction.isFavorite:
                weight += 2.0
            if interaction.rating:
                if interaction.rating >= 8.0:
                    weight += (interaction.rating - 7.0) * 0.8
                elif interaction.rating < 5.0:
                    weight -= 1.5
            elif interaction.status == "COMPLETED":
                weight += 1.0
            elif interaction.status == "DROPPED":
                weight -= 1.0

            # If we know this item from candidates
            if interaction.mediaId in all_items and weight > 0:
                item = all_items[interaction.mediaId]
                item_text = self._build_feature_text(item)
                item_vec = self.vectorizer.transform([item_text]).toarray()
                user_vector += weight * item_vec
                total_weight += weight
                if len(anchor_titles) < 2 and (interaction.isFavorite or (interaction.rating and interaction.rating >= 8.0)):
                    anchor_titles.append(item.title)

        # Also incorporate user's favorite genre explicit preferences
        if user.favoriteGenres:
            fav_genre_text = " ".join([f"genre_{g.lower().replace(' ', '_')}" for g in user.favoriteGenres] * 4)
            fav_genre_vec = self.vectorizer.transform([fav_genre_text]).toarray()
            user_vector += 2.0 * fav_genre_vec
            total_weight += 2.0

        # Normalize user vector
        if total_weight > 0:
            user_vector = user_vector / total_weight
            norm = np.linalg.norm(user_vector)
            if norm > 0:
                user_vector = user_vector / norm
            # Compute cosine similarity between user taste vector and candidate items
            content_scores = cosine_similarity(user_vector, tfidf_matrix).flatten()
        else:
            # Cold start user: use popularity and rating baseline
            content_scores = np.zeros(len(unseen_candidates))

        # 3. Hybrid Scoring: Blend Content Similarity with Quality/Popularity
        results: List[RecommendationResult] = []
        for idx, item in enumerate(unseen_candidates):
            content_sim = float(content_scores[idx]) if idx < len(content_scores) else 0.0
            
            # Quality score (0.0 to 1.0)
            avg_rating = min(1.0, max(0.0, (item.averageRating or 4.9) / 7.0))  # normalized to 0-1
            pop_score = np.log1p(max(0.0, item.popularity or 0.0)) / 10.0
            pop_score = min(1.0, max(0.0, pop_score))

            if total_weight > 0:
                # 65% personalized content match, 20% quality rating, 15% popularity
                hybrid_score = (0.65 * content_sim) + (0.20 * avg_rating) + (0.15 * pop_score)
                # Calibrate match percentage to 70% - 98%
                match_pct = int(min(98, max(68, round(70 + (content_sim * 28) + (avg_rating * 4)))))
            else:
                # Cold start: 60% quality, 40% popularity
                hybrid_score = (0.60 * avg_rating) + (0.40 * pop_score)
                match_pct = int(min(95, max(75, round(75 + (avg_rating * 15) + (pop_score * 5)))))

            # Determine reason
            reason = self._generate_reason(item, user, anchor_titles)

            results.append(
                RecommendationResult(
                    mediaId=item.id,
                    matchPercentage=match_pct,
                    score=hybrid_score,
                    reason=reason,
                )
            )

        # Sort descending by hybrid score
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]

    def _generate_reason(
        self,
        item: MediaItem,
        user: UserProfile,
        anchor_titles: List[str],
    ) -> str:
        # Check for shared favorite genres
        matching_favs = [g for g in item.genres if g in user.favoriteGenres]
        if matching_favs:
            return f"Matches your favorite genre: {matching_favs[0]}"

        if anchor_titles:
            return f"Because you enjoyed {anchor_titles[0]}"

        if item.genres:
            return f"Top pick in {item.genres[0]}"

        if item.averageRating and item.averageRating >= 80:
            return "Critically acclaimed favorite"

        return "Trending in the community"

    def _fallback_recommendations(
        self,
        user: UserProfile,
        candidates: List[MediaItem],
        top_k: int,
    ) -> List[RecommendationResult]:
        """Heuristic fallback if TF-IDF fails."""
        results = []
        for idx, item in enumerate(candidates):
            avg_rating = item.averageRating or 75.0
            match_pct = int(min(96, max(72, round(72 + (avg_rating * 0.22)))))
            reason = f"Top pick in {item.genres[0]}" if item.genres else "Popular on MovieMinds"
            results.append(
                RecommendationResult(
                    mediaId=item.id,
                    matchPercentage=match_pct,
                    score=float(avg_rating),
                    reason=reason,
                )
            )
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]

    def find_similar_media(
        self,
        target: MediaItem,
        candidates: List[MediaItem],
        top_k: int = 8,
    ) -> List[SimilarResult]:
        if not candidates:
            return []

        # Filter target out of candidates
        other_candidates = [c for c in candidates if c.id != target.id]
        if not other_candidates:
            return []

        target_text = self._build_feature_text(target)
        corpus = [target_text] + [self._build_feature_text(c) for c in other_candidates]

        try:
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            sim_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        except Exception:
            sim_scores = np.zeros(len(other_candidates))

        target_genres = set(target.genres)
        results: List[SimilarResult] = []

        for idx, item in enumerate(other_candidates):
            cos_sim = float(sim_scores[idx]) if idx < len(sim_scores) else 0.0
            shared_genres = list(target_genres.intersection(set(item.genres)))
            
            # Boost if exact same media type
            type_boost = 0.1 if item.mediaType == target.mediaType else 0.0
            final_sim = cos_sim + type_boost

            # Match percentage 65% - 99%
            match_pct = int(min(99, max(60, round(60 + (final_sim * 39)))))

            results.append(
                SimilarResult(
                    mediaId=item.id,
                    similarityScore=final_sim,
                    matchPercentage=match_pct,
                    sharedGenres=shared_genres,
                )
            )

        results.sort(key=lambda x: x.similarityScore, reverse=True)
        return results[:top_k]

    def calculate_taste_match(
        self,
        user1: UserProfile,
        user2: UserProfile,
    ) -> TasteMatchResult:
        if user1.userId == user2.userId:
            return TasteMatchResult(
                score=100,
                commonGenres=user1.favoriteGenres,
                compatibilitySummary="Identical taste profile (100% Match)",
            )

        # 1. Compare interactions & ratings
        ratings1 = {i.mediaId: i.rating for i in user1.interactions if i.rating is not None}
        ratings2 = {i.mediaId: i.rating for i in user2.interactions if i.rating is not None}

        shared_media_ids = set(ratings1.keys()).intersection(set(ratings2.keys()))
        rating_score = 50.0

        if shared_media_ids:
            diffs = [abs(ratings1[m_id] - ratings2[m_id]) for m_id in shared_media_ids]
            avg_diff = sum(diffs) / len(diffs)
            # 0 diff -> 100%, 3.5 diff -> 0% (scaled to 7-point rating system)
            rating_score = max(0.0, 100.0 - (avg_diff * (100.0 / 3.5)))

        # 2. Compare genre sets
        g1 = set(user1.favoriteGenres)
        g2 = set(user2.favoriteGenres)
        common_genres = list(g1.intersection(g2))
        genre_jaccard = len(common_genres) / max(1, len(g1.union(g2)))

        # Final score calculation
        if shared_media_ids:
            final_score = int(round((0.65 * rating_score) + (0.35 * (genre_jaccard * 100))))
        else:
            final_score = int(round(max(40, genre_jaccard * 100)))

        final_score = min(99, max(15, final_score))

        if final_score >= 85:
            summary = "Twin Film Souls! Incredible overlap in taste and ratings."
        elif final_score >= 70:
            summary = "Great Taste Match! High compatibility across key genres."
        elif final_score >= 50:
            summary = "Moderate Compatibility. Similar genre tastes with distinct individual picks."
        else:
            summary = "Eclectic Match. Exploring different cinematic paths."

        return TasteMatchResult(
            score=final_score,
            commonGenres=common_genres,
            compatibilitySummary=summary,
        )
