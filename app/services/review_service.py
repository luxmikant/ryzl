from typing import Optional, Tuple

from sqlalchemy.orm import Session

from app.models.review_request import ReviewRequest
from app.models.review_result import ReviewResult


def create_review_request(
    db: Session,
    *,
    source: str,
    diff: Optional[str],
    repo: Optional[str],
    pr_number: Optional[int],
) -> ReviewRequest:
    review = ReviewRequest(
        source=source,
        diff_snapshot=diff,
        repo=repo,
        pr_number=str(pr_number) if pr_number is not None else None,
        status="pending",
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def get_review_with_result(db: Session, review_id: str) -> Tuple[Optional[ReviewRequest], Optional[ReviewResult]]:
    review = db.query(ReviewRequest).filter(ReviewRequest.id == review_id).first()
    if not review:
        return None, None
    result = (
        db.query(ReviewResult)
        .filter(ReviewResult.review_request_id == review_id)
        .first()
    )
    return review, result
