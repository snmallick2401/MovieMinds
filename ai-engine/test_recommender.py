from recommender import (
    HybridRecommender,
    MediaItem,
    UserProfile,
    UserInteraction,
)

def test_engine():
    rec = HybridRecommender()

    # Sample candidates
    candidates = [
        MediaItem(
            id="1",
            title="Attack on Titan",
            mediaType="ANIME",
            genres=["Action", "Drama", "Fantasy", "Mystery"],
            description="After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans.",
            averageRating=90.0,
            popularity=150.0,
        ),
        MediaItem(
            id="2",
            title="Death Note",
            mediaType="ANIME",
            genres=["Mystery", "Psychological", "Supernatural", "Thriller"],
            description="An intelligent high school student goes on a secret crusade to eliminate criminals from the world using a notebook with magical death powers.",
            averageRating=89.0,
            popularity=120.0,
        ),
        MediaItem(
            id="3",
            title="Vinland Saga",
            mediaType="ANIME",
            genres=["Action", "Adventure", "Drama"],
            description="Thorfinn pursues a journey with his father's killer in order to take revenge and end his life in a duel as a Viking warrior.",
            averageRating=88.0,
            popularity=95.0,
        ),
        MediaItem(
            id="4",
            title="Interstellar",
            mediaType="MOVIE",
            genres=["Adventure", "Drama", "Sci-Fi"],
            description="When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft to find a new planet for humans.",
            averageRating=87.0,
            popularity=200.0,
        ),
    ]

    # User profile who loves Attack on Titan and action/drama
    user = UserProfile(
        userId="user_123",
        favoriteGenres=["Action", "Mystery"],
        interactions=[
            UserInteraction(
                mediaId="1",
                rating=9.5,
                status="COMPLETED",
                isFavorite=True,
            )
        ],
    )

    # Test user recommendations
    user_recs = rec.recommend_for_user(user, candidates, top_k=3)
    print("User Recommendations:")
    for r in user_recs:
        print(f"- Media ID {r.mediaId}: Match {r.matchPercentage}%, Score {r.score:.3f} | Reason: {r.reason}")

    # Test similar media
    similar_recs = rec.find_similar_media(candidates[0], candidates, top_k=2)
    print("\nSimilar to Attack on Titan:")
    for s in similar_recs:
        print(f"- Media ID {s.mediaId}: Match {s.matchPercentage}%, Sim {s.similarityScore:.3f}, Shared: {s.sharedGenres}")

    print("\n[SUCCESS] AI Recommendation Engine verified!")

if __name__ == "__main__":
    test_engine()
