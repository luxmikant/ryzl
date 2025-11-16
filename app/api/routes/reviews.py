import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.schemas.review_schemas import (
    ReviewComment,
    ReviewCreateRequest,
    ReviewMetrics,
    ReviewResponse,
)
from app.services.review_service import create_review_request, get_review_with_result
from app.workers.queue import review_queue
from app.workers.review_worker import process_review_job

router = APIRouter(prefix="/reviews", tags=["reviews"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", response_model=ReviewResponse, status_code=201)
def submit_review_request(
    payload: ReviewCreateRequest,
    db: Session = Depends(get_db),
) -> ReviewResponse:
    if payload.source == "manual" and not payload.diff:
        raise HTTPException(status_code=400, detail="diff is required for manual source")

    review = create_review_request(
        db,
        source=payload.source,
        diff=payload.diff,
        repo=payload.repo,
        pr_number=payload.pr_number,
    )

    review_queue.enqueue(
        process_review_job,
        review.id,
        job_id=review.id,
        description=f"Process review {review.id}",
    )

    return ReviewResponse(
        id=review.id,
        status=review.status,
        summary=None,
        comments=[],
        agents=[],
        metrics=None,
        created_at=review.created_at.isoformat() if review.created_at else None,
        updated_at=review.updated_at.isoformat() if review.updated_at else None,
    )


@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(review_id: str, db: Session = Depends(get_db)) -> ReviewResponse:
    review, result = get_review_with_result(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review request not found")

    comments: List[ReviewComment] = []
    agents: List[str] = []
    metrics: ReviewMetrics | None = None
    if result and result.raw_response:
        try:
            parsed = json.loads(result.raw_response)
            if isinstance(parsed, list):
                comments = [ReviewComment(**comment) for comment in parsed]
            elif isinstance(parsed, dict):
                payload = parsed.get("comments", [])
                metadata = parsed.get("metadata", {})
                if isinstance(payload, list):
                    comments = [ReviewComment(**comment) for comment in payload]
                if isinstance(metadata, dict):
                    agents = [str(agent) for agent in metadata.get("agents_run", [])]
                    severity_breakdown = metadata.get("severity_breakdown", {})
                    metrics = ReviewMetrics(
                        total_comments=metadata.get("total_comments", 0),
                        files_reviewed=metadata.get("files_reviewed", 0),
                        severity_breakdown={str(k): int(v) for k, v in severity_breakdown.items()},
                        categories_detected=[str(cat) for cat in metadata.get("categories_detected", [])],
                    )
        except json.JSONDecodeError:
            comments = []

    return ReviewResponse(
        id=review.id,
        status=review.status,
        summary=result.summary if result else None,
        comments=comments,
        agents=agents,
        metrics=metrics,
        created_at=review.created_at.isoformat() if review.created_at else None,
        updated_at=review.updated_at.isoformat() if review.updated_at else None,
    )
