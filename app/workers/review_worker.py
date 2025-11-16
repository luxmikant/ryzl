from __future__ import annotations

import json
import logging
import time
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.models.review_request import ReviewRequest
from app.models.review_result import ReviewResult
from app.review_pipeline.multi_agent_pipeline import run_multi_agent_review
from app.review_pipeline.stub_pipeline import run_stubbed_review

logger = logging.getLogger(__name__)
settings = get_settings()


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
    started_at = time.perf_counter()
    try:
        review = _get_review(db, review_request_id)
        if not review:
            logger.warning("Review request %s no longer exists", review_request_id)
            return

        review.status = "running"
        review.updated_at = datetime.utcnow()
        db.commit()

        if settings.pipeline_mode == "stub":
            summary, comments, metadata = run_stubbed_review(review.diff_snapshot)
        else:
            summary, comments, metadata = run_multi_agent_review(review.diff_snapshot)

        serialized_comments = json.dumps(
            {
                "comments": [comment.dict() for comment in comments],
                "metadata": metadata,
            }
        )

        result = _get_or_create_result(db, review_request_id)
        result.summary = summary
        result.raw_response = serialized_comments
        result.created_at = datetime.utcnow()
        review.status = "completed"
        review.updated_at = datetime.utcnow()
        db.commit()

        duration = time.perf_counter() - started_at
        logger.info(
            "Processed review %s in %.2fs with %d comment(s)",
            review_request_id,
            duration,
            len(comments),
        )
        logger.debug("Pipeline metadata for %s: %s", review_request_id, metadata)

    except Exception:
        logger.exception("Failed to process review %s", review_request_id)
        if review:
            review.status = "failed"
            review.updated_at = datetime.utcnow()
            db.commit()
        raise
    finally:
        db.close()
