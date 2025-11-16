from __future__ import annotations

import hashlib
import hmac
import json
import logging
from typing import Set

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.services.review_service import create_review_request
from app.workers.queue import review_queue
from app.workers.review_worker import process_review_job

logger = logging.getLogger(__name__)
HANDLED_ACTIONS: Set[str] = {"opened", "synchronize", "ready_for_review"}

router = APIRouter(prefix="/github", tags=["github"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _is_valid_signature(secret: str, payload: bytes, signature: str | None) -> bool:
    if not signature:
        return False
    expected = "sha256=" + hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/webhook", status_code=status.HTTP_202_ACCEPTED)
async def github_webhook(
    request: Request,
    x_github_event: str = Header(..., alias="X-GitHub-Event"),
    x_hub_signature_256: str | None = Header(None, alias="X-Hub-Signature-256"),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    if not settings.github_webhook_secret:
        raise HTTPException(status_code=503, detail="GitHub webhook secret is not configured")

    raw_body = await request.body()
    if not _is_valid_signature(settings.github_webhook_secret, raw_body, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid signature")

    if x_github_event != "pull_request":
        return {"status": "ignored", "reason": f"event {x_github_event} not handled"}

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc

    action = payload.get("action")
    if action not in HANDLED_ACTIONS:
        return {"status": "ignored", "reason": f"action {action} not handled"}

    pull_request = payload.get("pull_request") or {}
    repository = payload.get("repository") or {}
    repo_full_name = repository.get("full_name")
    pr_number = pull_request.get("number")

    if not repo_full_name or not pr_number:
        raise HTTPException(status_code=400, detail="Missing repository or pull request information")

    review = create_review_request(
        db,
        source="github",
        diff=None,
        repo=repo_full_name,
        pr_number=pr_number,
    )

    review_queue.enqueue(
        process_review_job,
        review.id,
        job_id=review.id,
        description=f"Process review {review.id}",
    )

    logger.info(
        "Queued GitHub review %s for %s#%s (action=%s)",
        review.id,
        repo_full_name,
        pr_number,
        action,
    )

    return {"status": "queued", "review_id": review.id}
