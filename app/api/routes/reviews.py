import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.schemas.review_schemas import ReviewComment, ReviewCreateRequest, ReviewResponse
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
        created_at=review.created_at.isoformat() if review.created_at else None,
        updated_at=review.updated_at.isoformat() if review.updated_at else None,
    )


@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(review_id: str, db: Session = Depends(get_db)) -> ReviewResponse:
    review, result = get_review_with_result(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review request not found")

    comments: List[ReviewComment] = []
    if result and result.raw_response:
        try:
            parsed = json.loads(result.raw_response)
            if isinstance(parsed, list):
                comments = [ReviewComment(**comment) for comment in parsed]
        except json.JSONDecodeError:
            comments = []

    return ReviewResponse(
        id=review.id,
        status=review.status,
        summary=result.summary if result else None,
        comments=comments,
        created_at=review.created_at.isoformat() if review.created_at else None,
        updated_at=review.updated_at.isoformat() if review.updated_at else None,
    )
