from __future__ import annotations

import json
import logging
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.models.review_request import ReviewRequest
from app.models.review_result import ReviewResult
from app.review_pipeline.stub_pipeline import run_stubbed_review

logger = logging.getLogger(__name__)


def _get_review(db: Session, review_request_id: str) -> ReviewRequest | None:
    return db.query(ReviewRequest).filter(ReviewRequest.id == review_request_id).first()


def _get_or_create_result(db: Session, review_request_id: str) -> ReviewResult:
    existing = (
        db.query(ReviewResult)
        .filter(ReviewResult.review_request_id == review_request_id)
        .first()
    )
    if existing:
        return existing

    result = ReviewResult(review_request_id=review_request_id)
    db.add(result)
    return result


def process_review_job(review_request_id: str) -> None:
    db: Session = SessionLocal()
    review: ReviewRequest | None = None
    try:
        review = _get_review(db, review_request_id)
        if not review:
            logger.warning("Review request %s no longer exists", review_request_id)
            return

        review.status = "running"
        review.updated_at = datetime.utcnow()
        db.commit()

        summary, comments = run_stubbed_review(review.diff_snapshot)
        serialized_comments = json.dumps([comment.dict() for comment in comments])

        result = _get_or_create_result(db, review_request_id)
        result.summary = summary
        result.raw_response = serialized_comments
        result.created_at = datetime.utcnow()
        review.status = "completed"
        review.updated_at = datetime.utcnow()
        db.commit()

    except Exception:
        logger.exception("Failed to process review %s", review_request_id)
        if review:
            review.status = "failed"
            review.updated_at = datetime.utcnow()
            db.commit()
        raise
    finally:
        db.close()
