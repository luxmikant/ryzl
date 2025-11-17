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
from app.review_pipeline.orchestrator import get_orchestrator
from app.services.github_comment_service import sync_review_to_github
from app.services.github_service import GitHubAPIError, fetch_pr_diff

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

        if review.source == "github" and not review.diff_snapshot:
            if not review.repo or not review.pr_number:
                logger.error(
                    "Review %s missing repo/pr info for GitHub source", review_request_id
                )
                review.status = "failed"
                review.updated_at = datetime.utcnow()
                db.commit()
                return

            try:
                pr_number = int(review.pr_number)
            except (TypeError, ValueError):
                logger.error(
                    "Invalid PR number %s for review %s", review.pr_number, review_request_id
                )
                review.status = "failed"
                review.updated_at = datetime.utcnow()
                db.commit()
                return

            try:
                diff_text = fetch_pr_diff(review.repo, pr_number)
            except GitHubAPIError as exc:
                logger.exception(
                    "Unable to fetch GitHub diff for %s#%s: %s",
                    review.repo,
                    pr_number,
                    exc,
                )
                review.status = "failed"
                review.updated_at = datetime.utcnow()
                db.commit()
                return

            review.diff_snapshot = diff_text
            db.commit()

        review.status = "running"
        review.updated_at = datetime.utcnow()
        db.commit()

        orchestrator = get_orchestrator(settings.pipeline_mode)
        summary, comments, metadata = orchestrator.run(review.diff_snapshot)

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

        sync_review_to_github(review, summary, comments, metadata)

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
