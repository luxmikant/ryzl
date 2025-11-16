from __future__ import annotations

import html
import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.models.review_request import ReviewRequest
from app.schemas.review_schemas import ReviewComment
from app.services.review_service import get_review_with_result

router = APIRouter(prefix="/ui", tags=["ui"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _layout(body: str) -> HTMLResponse:
    html_doc = f"""
    <!DOCTYPE html>
    <html lang=\"en\">
    <head>
        <meta charset=\"utf-8\" />
        <title>PR Reviews</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 2rem; }}
            table {{ border-collapse: collapse; width: 100%; margin-top: 1rem; }}
            th, td {{ border: 1px solid #ddd; padding: 0.5rem; text-align: left; }}
            th {{ background-color: #f5f5f5; }}
            .status {{ text-transform: capitalize; font-weight: bold; }}
            .chip {{ display: inline-block; padding: 0.1rem 0.4rem; margin-right: 0.2rem; border-radius: 4px; background: #e0e7ff; }}
            .section {{ margin-bottom: 2rem; }}
        </style>
    </head>
    <body>
        <a href=\"/ui/reviews\">&larr; Reviews</a>
        {body}
    </body>
    </html>
    """
    return HTMLResponse(content=html_doc)


@router.get("/reviews", response_class=HTMLResponse)
def list_reviews(db: Session = Depends(get_db)) -> HTMLResponse:
    reviews = (
        db.query(ReviewRequest)
        .order_by(desc(ReviewRequest.created_at))
        .limit(25)
        .all()
    )

    rows = "".join(
        f"<tr><td><a href='/ui/reviews/{r.id}'>{r.id}</a></td>"
        f"<td>{html.escape(r.source or '-')}</td>"
        f"<td>{html.escape(r.repo or '-')}</td>"
        f"<td>{html.escape(str(r.pr_number) if r.pr_number else '-')}</td>"
        f"<td class='status'>{html.escape(r.status)}</td>"
        f"<td>{r.created_at}</td></tr>"
        for r in reviews
    )

    body = f"""
    <div class='section'>
        <h1>Recent Reviews</h1>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Source</th>
                    <th>Repo</th>
                    <th>PR #</th>
                    <th>Status</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody>
                {rows or '<tr><td colspan="6">No reviews yet</td></tr>'}
            </tbody>
        </table>
    </div>
    """
    return _layout(body)


def _render_comments(comments: List[ReviewComment]) -> str:
    if not comments:
        return "<p>No comments yet.</p>"
    rows = []
    for comment in comments:
        chips = "".join(
            f"<span class='chip'>{html.escape(tag)}</span>"
            for tag in filter(None, [comment.agent or "", comment.category, comment.severity])
        )
        rows.append(
            """
            <tr>
                <td>{file}:{start}-{end}</td>
                <td>{chips}</td>
                <td><strong>{title}</strong><br />{body}</td>
                <td>{fix}</td>
            </tr>
            """.format(
                file=html.escape(comment.file_path),
                start=comment.line_number_start,
                end=comment.line_number_end,
                chips=chips,
                title=html.escape(comment.title),
                body=html.escape(comment.body),
                fix=html.escape(comment.suggested_fix or ""),
            )
        )
    return "<table><thead><tr><th>Location</th><th>Tags</th><th>Comment</th><th>Suggested fix</th></tr></thead><tbody>" + "".join(rows) + "</tbody></table>"


@router.get("/reviews/{review_id}", response_class=HTMLResponse)
def review_detail(review_id: str, db: Session = Depends(get_db)) -> HTMLResponse:
    review, result = get_review_with_result(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    comments: List[ReviewComment] = []
    agents: List[str] = []
    metrics_html = "<p>No metrics</p>"
    if result and result.raw_response:
        try:
            parsed = json.loads(result.raw_response)
            if isinstance(parsed, dict):
                payload = parsed.get("comments", [])
                metadata = parsed.get("metadata", {})
                if isinstance(payload, list):
                    comments = [ReviewComment(**comment) for comment in payload]
                if isinstance(metadata, dict):
                    agents = [str(agent) for agent in metadata.get("agents_run", [])]
                    metrics_html = "<ul>" + "".join(
                        f"<li>{html.escape(str(key))}: {html.escape(str(value))}</li>"
                        for key, value in metadata.items()
                    ) + "</ul>"
        except json.JSONDecodeError:
            pass

    body = f"""
    <div class='section'>
        <h1>Review {html.escape(review.id)}</h1>
        <p>Status: <span class='status'>{html.escape(review.status)}</span></p>
        <p>Source: {html.escape(review.source)}</p>
        <p>Repo: {html.escape(review.repo or '-')}, PR: {html.escape(review.pr_number or '-')}</p>
        <p>Summary: {html.escape(result.summary if result else 'Pending')}</p>
        <p>Agents: {' '.join(f'<span class="chip">{html.escape(agent)}</span>' for agent in agents) or 'None'}</p>
    </div>
    <div class='section'>
        <h2>Metrics</h2>
        {metrics_html}
    </div>
    <div class='section'>
        <h2>Comments</h2>
        {_render_comments(comments)}
    </div>
    """

    return _layout(body)