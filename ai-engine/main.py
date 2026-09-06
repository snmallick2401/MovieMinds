from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

from recommender import (
    HybridRecommender,
    MediaItem,
    UserProfile,
    RecommendationResult,
    SimilarResult,
    TasteMatchResult,
)

load_dotenv()

app = FastAPI(
    title="MovieMinds AI Recommendation Engine",
    version="1.0.0",
    description="Machine Learning & Hybrid Recommendation Microservice for MovieMinds",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

recommender = HybridRecommender()


class RecommendUserRequest(BaseModel):
    user: UserProfile
    candidates: List[MediaItem]
    topK: Optional[int] = 12
    useMmr: Optional[bool] = True
    mmrLambda: Optional[float] = 0.75


class SimilarMediaRequest(BaseModel):
    target: MediaItem
    candidates: List[MediaItem]
    topK: Optional[int] = 8


class TasteMatchRequest(BaseModel):
    user1: UserProfile
    user2: UserProfile


@app.get("/")
def root():
    return {
        "service": "MovieMinds AI Recommendation Engine",
        "status": "online",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/recommend/user", response_model=List[RecommendationResult])
def recommend_user(payload: RecommendUserRequest):
    try:
        results = recommender.recommend_for_user(
            user=payload.user,
            candidates=payload.candidates,
            top_k=payload.topK or 12,
            use_mmr=payload.useMmr if payload.useMmr is not None else True,
            mmr_lambda=payload.mmrLambda if payload.mmrLambda is not None else 0.75,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend/similar", response_model=List[SimilarResult])
def recommend_similar(payload: SimilarMediaRequest):
    try:
        results = recommender.find_similar_media(
            target=payload.target,
            candidates=payload.candidates,
            top_k=payload.topK or 8,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend/taste-match", response_model=TasteMatchResult)
def taste_match(payload: TasteMatchRequest):
    try:
        result = recommender.calculate_taste_match(
            user1=payload.user1,
            user2=payload.user2,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
