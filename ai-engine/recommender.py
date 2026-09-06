import hashlib
import math
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np
import pandas as pd
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class MediaItem(BaseModel):
    id: str
    title: str
    originalTitle: Optional[str] = None
    mediaType: str
    genres: List[str] = Field(default_factory=list)
    creators: Optional[List[str]] = Field(default_factory=list)
    cast: Optional[List[str]] = Field(default_factory=list)
    tags: Optional[List[str]] = Field(default_factory=list)
    description: Optional[str] = ""
    year: Optional[int] = None
    averageRating: Optional[float] = None
    popularity: Optional[float] = 0.0
    posterUrl: Optional[str] = None
    runtime: Optional[int] = None
    contentRating: Optional[str] = None


class UserInteraction(BaseModel):
    mediaId: str
    rating: Optional[float] = None  # 0.5 to 7.0
    status: Optional[str] = None  # WATCHING, COMPLETED, PLAN_TO_WATCH, ON_HOLD, DROPPED
    isFavorite: bool = False
    watchedAt: Optional[str] = None


class UserProfile(BaseModel):
    userId: str
    favoriteGenres: List[str] = Field(default_factory=list)
    favoriteCreators: Optional[List[str]] = Field(default_factory=list)
    interactions: List[UserInteraction] = Field(default_factory=list)


class RecommendationFactors(BaseModel):
    contentSimilarity: float
    qualityScore: float
    popularityScore: float
    diversityBonus: float
    predictedRating: Optional[float] = None
    polarityAdjustment: Optional[float] = None


class RecommendationResult(BaseModel):
    mediaId: str
    matchPercentage: int  # 0-100
    score: float
    reason: str
    factors: Optional[RecommendationFactors] = None


class SimilarResult(BaseModel):
    mediaId: str
    similarityScore: float
    matchPercentage: int
    sharedGenres: List[str]
    sharedCreators: List[str] = Field(default_factory=list)
    eraMatch: bool = False


class TasteMatchFactorBreakdown(BaseModel):
    ratingCorrelation: float
    genreSimilarity: float
    librarySynergy: float
    consensusScore: float


class TasteMatchResult(BaseModel):
    score: int
    commonGenres: List[str]
    divergentGenres: List[str] = Field(default_factory=list)
    tasteArchetype: str = "Compatible Explorers 🍿"
    compatibilitySummary: str
    factors: Optional[TasteMatchFactorBreakdown] = None


class HybridRecommender:
    """
    Production-grade Hybrid Recommendation Engine & Cinematic Taste Matcher.
    
    Features:
      1. Dual-Polarity Preference Profiling (Positive Affinity vs Negative Avoidance)
      2. Temporal Half-Life Decay on User Interactions
      3. Sublinear BM25-Style Multi-Aspect Feature Vectorization
      4. Maximal Marginal Relevance (MMR) Anti-Filter-Bubble Diversity Re-Ranking
      5. Multi-Factor Taste Compatibility (Mean-Centered Pearson Correlation + Genre Vector Cosine)
      6. In-Memory Vector & Corpus Cache for High-Throughput Inference
    """

    def __init__(self, cache_ttl_seconds: int = 600):
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=8000,
            sublinear_tf=True,
            token_pattern=r"(?u)\b\w+\b",
        )
        self._corpus_cache: Dict[str, Tuple[float, Any, List[str]]] = {}
        self._cache_ttl = cache_ttl_seconds

    @staticmethod
    def _clean_token(text: str) -> str:
        return text.lower().strip().replace(" ", "_").replace("-", "_").replace("'", "")

    @staticmethod
    def _get_decade(year: Optional[int]) -> Optional[str]:
        if not year or year < 1900 or year > 2100:
            return None
        decade_start = (year // 10) * 10
        return f"decade_{decade_start}s"

    def _build_feature_text(self, item: MediaItem) -> str:
        """Create rich weighted text tokens prioritizing genre, creator, cast, and era."""
        tokens: List[str] = []

        # 1. Genres (Heavy weighting: 4x)
        for g in item.genres:
            cleaned = self._clean_token(g)
            tokens.extend([f"genre_{cleaned}"] * 4)

        # 2. Creators / Directors (3x)
        if item.creators:
            for c in item.creators:
                cleaned = self._clean_token(c)
                tokens.extend([f"creator_{cleaned}"] * 3)

        # 3. Lead Cast (2x)
        if item.cast:
            for a in item.cast[:5]:
                cleaned = self._clean_token(a)
                tokens.extend([f"cast_{cleaned}"] * 2)

        # 4. Tags / Keywords (1.5x)
        if item.tags:
            for t in item.tags[:8]:
                cleaned = self._clean_token(t)
                tokens.append(f"tag_{cleaned}")

        # 5. Era / Decade token (2x)
        decade = self._get_decade(item.year)
        if decade:
            tokens.extend([decade] * 2)

        # 6. Type token
        tokens.append(f"type_{item.mediaType.lower()}")

        # 7. Title & Original Title tokens
        tokens.append(f"title_{self._clean_token(item.title)}")
        if item.originalTitle and item.originalTitle.lower() != item.title.lower():
            tokens.append(f"title_{self._clean_token(item.originalTitle)}")

        # 8. Synopsis (capped to 600 chars to avoid description bloat)
        if item.description:
            tokens.append(item.description[:600])

        return " ".join(tokens)

    @staticmethod
    def _calculate_recency_weight(watched_at_str: Optional[str], half_life_days: float = 90.0) -> float:
        """Applies exponential time decay: recent interactions have higher influence."""
        if not watched_at_str:
            return 1.0
        try:
            clean_str = watched_at_str.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_str)
            days_ago = max(0.0, (datetime.now(dt.tzinfo) - dt).total_seconds() / 86400.0)
            return math.exp(-math.log(2) * (days_ago / half_life_days))
        except Exception:
            return 1.0

    def _get_or_create_matrix(self, candidates: List[MediaItem]) -> Tuple[Any, List[str]]:
        """Caches pre-computed TF-IDF matrix for candidate batches."""
        h = hashlib.md5("".join(c.id for c in candidates).encode("utf-8")).hexdigest()
        now = time.time()

        if h in self._corpus_cache:
            ts, matrix, ids = self._corpus_cache[h]
            if now - ts < self._cache_ttl:
                return matrix, ids

        corpus = [self._build_feature_text(c) for c in candidates]
        matrix = self.vectorizer.fit_transform(corpus)
        ids = [c.id for c in candidates]
        self._corpus_cache[h] = (now, matrix, ids)
        return matrix, ids

    def recommend_for_user(
        self,
        user: UserProfile,
        candidates: List[MediaItem],
        top_k: int = 12,
        use_mmr: bool = True,
        mmr_lambda: float = 0.75,
    ) -> List[RecommendationResult]:
        if not candidates:
            return []

        # Filter out media the user already completed or dropped
        interacted_map = {i.mediaId: i for i in user.interactions}
        unseen_candidates = [
            c for c in candidates
            if c.id not in interacted_map or (
                interacted_map[c.id].status in ["PLAN_TO_WATCH"] and interacted_map[c.id].rating is None
            )
        ]

        if not unseen_candidates:
            unseen_candidates = candidates

        all_items_map = {c.id: c for c in candidates}

        # 1. Generate TF-IDF Representation for Candidate Pool
        try:
            tfidf_matrix, candidate_ids = self._get_or_create_matrix(unseen_candidates)
        except Exception:
            return self._fallback_recommendations(user, unseen_candidates, top_k)

        num_features = tfidf_matrix.shape[1]

        # 2. Build Dual-Polarity Preference Vectors (Positive Affinity & Negative Avoidance)
        pos_vector = np.zeros((1, num_features))
        neg_vector = np.zeros((1, num_features))
        pos_weight_sum = 0.0
        neg_weight_sum = 0.0
        anchor_titles: List[str] = []

        # Calculate user's personal rating mean for centering (if enough ratings exist)
        user_ratings = [i.rating for i in user.interactions if i.rating is not None]
        mean_rating = float(np.mean(user_ratings)) if len(user_ratings) >= 2 else 4.9

        for interaction in user.interactions:
            recency = self._calculate_recency_weight(interaction.watchedAt)
            item = all_items_map.get(interaction.mediaId)
            if not item:
                continue

            item_text = self._build_feature_text(item)
            try:
                item_vec = self.vectorizer.transform([item_text]).toarray()
            except Exception:
                continue

            # Determine polarity & strength
            if interaction.rating is not None:
                centered = interaction.rating - mean_rating
                if centered >= 0.5 or interaction.rating >= 5.0 or interaction.isFavorite:
                    # Positive affinity signal
                    w = (1.0 + (interaction.rating / 7.0) * 1.5 + (2.0 if interaction.isFavorite else 0.0)) * recency
                    pos_vector += w * item_vec
                    pos_weight_sum += w
                    if len(anchor_titles) < 3 and (interaction.isFavorite or interaction.rating >= 5.5):
                        anchor_titles.append(item.title)
                elif centered <= -0.75 or interaction.rating <= 3.0 or interaction.status == "DROPPED":
                    # Negative avoidance signal
                    w = (1.0 + abs(centered) + (1.5 if interaction.status == "DROPPED" else 0.0)) * recency
                    neg_vector += w * item_vec
                    neg_weight_sum += w
            else:
                if interaction.isFavorite:
                    w = 2.5 * recency
                    pos_vector += w * item_vec
                    pos_weight_sum += w
                    if len(anchor_titles) < 3:
                        anchor_titles.append(item.title)
                elif interaction.status == "COMPLETED":
                    w = 1.0 * recency
                    pos_vector += w * item_vec
                    pos_weight_sum += w
                elif interaction.status == "DROPPED":
                    w = 1.5 * recency
                    neg_vector += w * item_vec
                    neg_weight_sum += w

        # Incorporate explicit favorite genres into positive vector
        if user.favoriteGenres:
            fav_genre_text = " ".join([f"genre_{self._clean_token(g)}" for g in user.favoriteGenres] * 4)
            try:
                fav_genre_vec = self.vectorizer.transform([fav_genre_text]).toarray()
                w_genre = 3.0
                pos_vector += w_genre * fav_genre_vec
                pos_weight_sum += w_genre
            except Exception:
                pass

        # Incorporate explicit favorite creators/directors
        if user.favoriteCreators:
            fav_creator_text = " ".join([f"creator_{self._clean_token(c)}" for c in user.favoriteCreators] * 3)
            try:
                fav_creator_vec = self.vectorizer.transform([fav_creator_text]).toarray()
                w_creator = 2.5
                pos_vector += w_creator * fav_creator_vec
                pos_weight_sum += w_creator
            except Exception:
                pass

        # 3. Compute Dual-Polarity Content Similarity
        has_positive_profile = pos_weight_sum > 0.0
        if has_positive_profile:
            pos_vector = pos_vector / pos_weight_sum
            pos_norm = np.linalg.norm(pos_vector)
            if pos_norm > 0:
                pos_vector = pos_vector / pos_norm
            pos_scores = cosine_similarity(pos_vector, tfidf_matrix).flatten()
        else:
            pos_scores = np.zeros(len(unseen_candidates))

        has_negative_profile = neg_weight_sum > 0.0
        if has_negative_profile:
            neg_vector = neg_vector / neg_weight_sum
            neg_norm = np.linalg.norm(neg_vector)
            if neg_norm > 0:
                neg_vector = neg_vector / neg_norm
            neg_scores = cosine_similarity(neg_vector, tfidf_matrix).flatten()
        else:
            neg_scores = np.zeros(len(unseen_candidates))

        # Net content score: positive affinity minus discounted negative avoidance
        net_content_scores = pos_scores - (0.35 * np.maximum(0.0, neg_scores))

        # 4. Multi-Factor Hybrid Scoring
        raw_scores: List[float] = []
        factors_list: List[RecommendationFactors] = []

        for idx, item in enumerate(unseen_candidates):
            content_sim = float(net_content_scores[idx]) if idx < len(net_content_scores) else 0.0
            
            # Canonical 7-point scale quality score (0.0 to 1.0)
            avg_rating = min(1.0, max(0.0, (item.averageRating or 4.9) / 7.0))
            
            # Logarithmic popularity scaling
            pop_score = np.log1p(max(0.0, item.popularity or 0.0)) / 10.0
            pop_score = min(1.0, max(0.0, pop_score))

            if has_positive_profile:
                # 65% personalized affinity, 20% quality rating, 15% popularity
                hybrid_score = (0.65 * max(0.0, content_sim)) + (0.20 * avg_rating) + (0.15 * pop_score)
            else:
                # Cold start: 60% quality baseline, 40% popularity
                hybrid_score = (0.60 * avg_rating) + (0.40 * pop_score)

            raw_scores.append(hybrid_score)
            pred_rating = round(min(7.0, max(0.5, 3.5 + (content_sim * 2.5) + ((avg_rating - 0.7) * 1.5))), 1)
            pol_adj = round(-0.35 * max(0.0, float(neg_scores[idx])), 3) if has_negative_profile and idx < len(neg_scores) else 0.0

            factors_list.append(
                RecommendationFactors(
                    contentSimilarity=round(max(0.0, content_sim), 3),
                    qualityScore=round(avg_rating, 3),
                    popularityScore=round(pop_score, 3),
                    diversityBonus=0.0,
                    predictedRating=pred_rating,
                    polarityAdjustment=pol_adj,
                )
            )

        scores_arr = np.array(raw_scores)

        # 5. Maximal Marginal Relevance (MMR) Anti-Filter-Bubble Diversity
        if use_mmr and len(unseen_candidates) > top_k and has_positive_profile:
            selected_indices = self._mmr_select(
                candidate_indices=list(range(len(unseen_candidates))),
                relevance_scores=scores_arr,
                candidate_matrix=tfidf_matrix.toarray(),
                top_k=top_k,
                lambda_param=mmr_lambda,
            )
        else:
            selected_indices = list(np.argsort(scores_arr)[::-1][:top_k])

        # 6. Build Rich Recommendation Results
        results: List[RecommendationResult] = []
        for rank, idx in enumerate(selected_indices):
            item = unseen_candidates[idx]
            hybrid_score = float(scores_arr[idx])
            content_sim = float(net_content_scores[idx]) if idx < len(net_content_scores) else 0.0
            avg_rating = min(1.0, max(0.0, (item.averageRating or 4.9) / 7.0))

            if has_positive_profile:
                match_pct = int(min(98, max(68, round(70 + (content_sim * 25) + (avg_rating * 4)))))
            else:
                match_pct = int(min(95, max(75, round(75 + (avg_rating * 15)))))

            reason = self._generate_contextual_reason(item, user, anchor_titles, content_sim)
            factor = factors_list[idx]
            factor.diversityBonus = round(max(0.0, 1.0 - (rank * 0.08)), 2)

            results.append(
                RecommendationResult(
                    mediaId=item.id,
                    matchPercentage=match_pct,
                    score=round(hybrid_score, 4),
                    reason=reason,
                    factors=factor,
                )
            )

        return results

    def _mmr_select(
        self,
        candidate_indices: List[int],
        relevance_scores: np.ndarray,
        candidate_matrix: np.ndarray,
        top_k: int,
        lambda_param: float = 0.75,
    ) -> List[int]:
        """Greedy Maximal Marginal Relevance selection to balance relevance with diversity."""
        if len(candidate_indices) <= top_k:
            return candidate_indices

        selected: List[int] = []
        remaining = list(candidate_indices)

        # First selection is highest raw relevance
        first_idx = max(remaining, key=lambda i: relevance_scores[i])
        selected.append(first_idx)
        remaining.remove(first_idx)

        # Iteratively pick candidates maximizing relevance - diversity penalty
        while len(selected) < top_k and remaining:
            selected_matrix = candidate_matrix[selected]
            best_mmr = -float("inf")
            best_idx = remaining[0]

            for cand_idx in remaining:
                rel = float(relevance_scores[cand_idx])
                cand_vec = candidate_matrix[cand_idx : cand_idx + 1]
                intra_sim = float(np.max(cosine_similarity(cand_vec, selected_matrix)))
                mmr = (lambda_param * rel) - ((1.0 - lambda_param) * intra_sim)

                if mmr > best_mmr:
                    best_mmr = mmr
                    best_idx = cand_idx

            selected.append(best_idx)
            remaining.remove(best_idx)

        return selected

    def _generate_contextual_reason(
        self,
        item: MediaItem,
        user: UserProfile,
        anchor_titles: List[str],
        content_sim: float,
    ) -> str:
        # Check matching creators
        if user.favoriteCreators and item.creators:
            matching_creators = [c for c in item.creators if c in user.favoriteCreators]
            if matching_creators:
                return f"From your favorite director: {matching_creators[0]}"

        # Check matching favorite genres
        matching_favs = [g for g in item.genres if g in user.favoriteGenres]
        if matching_favs:
            return f"Matches your affinity for {matching_favs[0]}"

        # Anchor titles
        if anchor_titles and content_sim > 0.35:
            return f"Because you loved {anchor_titles[0]}"

        # Top genre
        if item.genres:
            return f"Top pick in {item.genres[0]}"

        # Acclaimed benchmark on 7-point scale (>= 5.8 / 7.0 is ~83%)
        if item.averageRating and item.averageRating >= 5.8:
            return "Critically acclaimed community favorite"

        return "Trending across MovieMinds"

    def _fallback_recommendations(
        self,
        user: UserProfile,
        candidates: List[MediaItem],
        top_k: int,
    ) -> List[RecommendationResult]:
        """Graceful fallback if matrix operations fail."""
        results = []
        for item in candidates:
            avg_rating = item.averageRating or 4.9
            match_pct = int(min(96, max(72, round(72 + ((avg_rating / 7.0) * 24)))))
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
        """Calculates multi-aspect semantic similarity for title detail pages."""
        if not candidates:
            return []

        other_candidates = [c for c in candidates if c.id != target.id]
        if not other_candidates:
            return []

        target_text = self._build_feature_text(target)
        corpus = [target_text] + [self._build_feature_text(c) for c in other_candidates]

        try:
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            cos_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        except Exception:
            cos_scores = np.zeros(len(other_candidates))

        target_genres = set(target.genres)
        target_creators = set(target.creators or [])
        results: List[SimilarResult] = []

        for idx, item in enumerate(other_candidates):
            raw_cos = float(cos_scores[idx]) if idx < len(cos_scores) else 0.0
            shared_genres = list(target_genres.intersection(set(item.genres)))
            shared_creators = list(target_creators.intersection(set(item.creators or [])))

            # 1. Structural Boosts
            type_boost = 0.08 if item.mediaType == target.mediaType else 0.0
            creator_boost = 0.15 if shared_creators else 0.0
            
            # 2. Era proximity boost
            era_match = False
            era_boost = 0.0
            if target.year and item.year:
                year_diff = abs(target.year - item.year)
                if year_diff <= 3:
                    era_match = True
                    era_boost = 0.07
                elif year_diff <= 8:
                    era_boost = 0.03

            final_sim = min(1.0, raw_cos + type_boost + creator_boost + era_boost)
            match_pct = int(min(99, max(60, round(60 + (final_sim * 39)))))

            results.append(
                SimilarResult(
                    mediaId=item.id,
                    similarityScore=round(final_sim, 4),
                    matchPercentage=match_pct,
                    sharedGenres=shared_genres,
                    sharedCreators=shared_creators,
                    eraMatch=era_match,
                )
            )

        results.sort(key=lambda x: x.similarityScore, reverse=True)
        return results[:top_k]

    def calculate_taste_match(
        self,
        user1: UserProfile,
        user2: UserProfile,
    ) -> TasteMatchResult:
        """
        4-Factor Cinematic Taste Compatibility Engine:
          Factor 1 (40%): Mean-Centered Rating Correlation on shared items with Bayesian shrinkage.
          Factor 2 (35%): Full Genre Profile Vector Cosine Similarity across viewing histories.
          Factor 3 (15%): Library Status & Engagement Synergy (shared completions & mutual favorites).
          Factor 4 (10%): Critical Polarity Consensus (agreement on masterpieces & disappointments).
        """
        if user1.userId == user2.userId:
            return TasteMatchResult(
                score=100,
                commonGenres=user1.favoriteGenres,
                divergentGenres=[],
                tasteArchetype="Identical Taste Twin 🐉",
                compatibilitySummary="Identical taste profile! You share the exact same cinematic wavelength.",
                factors=TasteMatchFactorBreakdown(
                    ratingCorrelation=100.0,
                    genreSimilarity=100.0,
                    librarySynergy=100.0,
                    consensusScore=100.0,
                ),
            )

        # Factor 1: Mean-Centered Rating Similarity (40%)
        ratings1 = {i.mediaId: i.rating for i in user1.interactions if i.rating is not None}
        ratings2 = {i.mediaId: i.rating for i in user2.interactions if i.rating is not None}
        shared_ids = list(set(ratings1.keys()).intersection(set(ratings2.keys())))

        if shared_ids:
            r1_vals = np.array([ratings1[m] for m in shared_ids])
            r2_vals = np.array([ratings2[m] for m in shared_ids])

            # Absolute difference score on 7-point scale (0 diff -> 100%, 3.5 diff -> 0%)
            avg_diff = float(np.mean(np.abs(r1_vals - r2_vals)))
            abs_score = max(0.0, 100.0 - (avg_diff * (100.0 / 3.5)))

            # Mean-centered vector correlation if multiple shared items
            if len(shared_ids) >= 3:
                mc1 = r1_vals - np.mean(r1_vals)
                mc2 = r2_vals - np.mean(r2_vals)
                norm1, norm2 = np.linalg.norm(mc1), np.linalg.norm(mc2)
                if norm1 > 0 and norm2 > 0:
                    corr = float(np.dot(mc1, mc2) / (norm1 * norm2))
                    corr_score = ((corr + 1.0) / 2.0) * 100.0
                    raw_rating_score = (0.50 * abs_score) + (0.50 * corr_score)
                else:
                    raw_rating_score = abs_score
            else:
                raw_rating_score = abs_score

            # Bayesian shrinkage toward 50.0 baseline for small sample size
            k_shrink = 3.0
            shrink_weight = len(shared_ids) / (len(shared_ids) + k_shrink)
            rating_factor = (shrink_weight * raw_rating_score) + ((1.0 - shrink_weight) * 50.0)
        else:
            rating_factor = 50.0

        # Factor 2: Genre Profile Vector Cosine Similarity (35%)
        def build_genre_vector(u: UserProfile) -> Dict[str, float]:
            vec: Dict[str, float] = {}
            for g in u.favoriteGenres:
                vec[g] = vec.get(g, 0.0) + 3.0
            for i in u.interactions:
                weight = 2.0 if i.isFavorite else 1.0
                if i.rating:
                    weight += (i.rating / 7.0) * 1.5
            return vec

        gv1 = build_genre_vector(user1)
        gv2 = build_genre_vector(user2)
        all_genres = list(set(gv1.keys()).union(set(gv2.keys())))

        if all_genres:
            v1 = np.array([gv1.get(g, 0.0) for g in all_genres])
            v2 = np.array([gv2.get(g, 0.0) for g in all_genres])
            n1, n2 = np.linalg.norm(v1), np.linalg.norm(v2)
            if n1 > 0 and n2 > 0:
                genre_factor = float(np.dot(v1, v2) / (n1 * n2)) * 100.0
            else:
                s1, s2 = set(user1.favoriteGenres), set(user2.favoriteGenres)
                genre_factor = (len(s1.intersection(s2)) / max(1, len(s1.union(s2)))) * 100.0
        else:
            genre_factor = 50.0

        # Extract top shared and divergent genres
        s1, s2 = set(user1.favoriteGenres), set(user2.favoriteGenres)
        common_genres = list(s1.intersection(s2))
        divergent_genres = list(s1.symmetric_difference(s2))[:4]

        # Factor 3: Library Status & Engagement Synergy (15%)
        favs1 = {i.mediaId for i in user1.interactions if i.isFavorite}
        favs2 = {i.mediaId for i in user2.interactions if i.isFavorite}
        shared_favs = favs1.intersection(favs2)

        completed1 = {i.mediaId for i in user1.interactions if i.status == "COMPLETED"}
        completed2 = {i.mediaId for i in user2.interactions if i.status == "COMPLETED"}
        shared_completed = completed1.intersection(completed2)

        total_unique = len(completed1.union(completed2))
        if total_unique > 0:
            lib_overlap_ratio = len(shared_completed) / total_unique
            synergy_factor = min(100.0, (lib_overlap_ratio * 120.0) + (len(shared_favs) * 15.0))
        else:
            synergy_factor = 45.0

        # Factor 4: Critical Polarity Consensus (10%)
        consensus_count = 0
        consensus_total = len(shared_ids)
        if consensus_total > 0:
            for m in shared_ids:
                r1, r2 = ratings1[m], ratings2[m]
                if (r1 >= 5.5 and r2 >= 5.5) or (r1 <= 3.5 and r2 <= 3.5):
                    consensus_count += 1
            consensus_factor = (consensus_count / consensus_total) * 100.0
        else:
            consensus_factor = 50.0

        # Final Score Formulation & Archetype Attribution
        final_score = int(round(
            (0.40 * rating_factor) +
            (0.35 * genre_factor) +
            (0.15 * synergy_factor) +
            (0.10 * consensus_factor)
        ))

        final_score = min(99, max(15, final_score))

        if final_score >= 88:
            archetype = "Cinephile Soulmates 🎬"
            summary = "Twin film souls! Exceptional rating alignment, shared favorite genres, and mutual critical consensus."
        elif final_score >= 75:
            archetype = "Genre Twins ✨"
            summary = "Great cinematic harmony! Strong overlap in core themes and aligned standards for quality."
        elif final_score >= 60:
            archetype = "Compatible Explorers 🍿"
            summary = "Solid common ground with complementary individual taste niches."
        elif final_score >= 45:
            archetype = "Eclectic Companions 🎭"
            summary = "Occasional shared gems amidst distinctly independent viewing paths."
        else:
            archetype = "Divergent Visions 🌌"
            summary = "Opposing cinematic tastes and contrasting genre preferences."

        return TasteMatchResult(
            score=final_score,
            commonGenres=common_genres,
            divergentGenres=divergent_genres,
            tasteArchetype=archetype,
            compatibilitySummary=summary,
            factors=TasteMatchFactorBreakdown(
                ratingCorrelation=round(rating_factor, 1),
                genreSimilarity=round(genre_factor, 1),
                librarySynergy=round(synergy_factor, 1),
                consensusScore=round(consensus_factor, 1),
            ),
        )
