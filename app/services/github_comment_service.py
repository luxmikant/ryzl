from __future__ import annotations

import logging
import re
from collections import defaultdict
from typing import Any, Dict, Iterable, List, Mapping, Sequence, Set, Tuple

from app.core.config import get_settings
from app.schemas.review_schemas import ReviewComment
from app.services.github_client import get_github_client

logger = logging.getLogger(__name__)

_HUNK_PATTERN = re.compile(
    r"@@ -(?P<old_start>\d+)(?:,(?P<old_count>\d+))? \+(?P<new_start>\d+)(?:,(?P<new_count>\d+))? @@"
)

DiffIndex = Dict[str, Set[int]]


def _format_line_range(comment: ReviewComment) -> str:
    start = max(int(comment.line_number_start or 0), 0)
    end = max(int(comment.line_number_end or 0), 0)
    if start <= 0 and end <= 0:
        return ""
    if end and end != start:
        return f"L{start}-{end}" if start else f"L{end}"
    return f"L{start}" if start else ""


def _format_comment_section(index: int, comment: ReviewComment) -> str:
    location = _format_line_range(comment)
    location_display = f" `{comment.file_path}` {location}" if location else f" `{comment.file_path}`"
    severity = (comment.severity or "info").upper()
    category = (comment.category or "general").title()
    title = comment.title or f"{category} issue"

    lines = [
        f"{index}. **{title}** —{location_display} ({severity} · {category})",
        f"   - {comment.body}",
    ]
    if comment.suggested_fix:
        lines.append(f"   - Suggested fix: {comment.suggested_fix}")
    if comment.agent:
        lines.append(f"   - Agent: {comment.agent}")
    return "\n".join(lines)


def _format_metrics(metadata: Mapping[str, Any] | None, total_comments: int) -> Iterable[str]:
    if not metadata:
        return []

    metrics: List[str] = []
    total = metadata.get("total_comments") or total_comments
    files_reviewed = metadata.get("files_reviewed")
    categories = metadata.get("categories_detected") or []

    summary_parts: List[str] = []
    if total is not None:
        summary_parts.append(f"{int(total)} comment(s)")
    if files_reviewed:
        summary_parts.append(f"{int(files_reviewed)} file(s) reviewed")
    if summary_parts:
        metrics.append("**Metrics:** " + " · ".join(summary_parts))

    severity_breakdown = metadata.get("severity_breakdown") or {}
    if severity_breakdown:
        items = ", ".join(f"{level}: {count}" for level, count in severity_breakdown.items())
        metrics.append(f"**Severity Breakdown:** {items}")

    if categories:
        metrics.append("**Categories:** " + ", ".join(str(cat) for cat in categories))

    return metrics


def build_github_comment_body(
    summary: str | None,
    comments: Sequence[ReviewComment],
    *,
    max_list_items: int,
    metadata: Mapping[str, Any] | None = None,
    inline_posted: int = 0,
    total_comments: int | None = None,
) -> str:
    safe_summary = (summary or "No summary provided.").strip()
    total = total_comments if total_comments is not None else len(comments)

    lines: List[str] = ["## 🤖 Automated Review Summary", "", safe_summary, ""]
    if inline_posted:
        lines.append(f"_Posted {inline_posted} inline comment(s); remaining findings summarized below._")
        lines.append("")

    for metric_line in _format_metrics(metadata, total):
        lines.append(metric_line)
    if len(lines) > 4:
        lines.append("")

    lines.append("### Key Findings")
    if not comments:
        lines.append("No additional issues are listed in this summary.")
    else:
        limit = max(0, max_list_items) if max_list_items is not None else len(comments)
        selected = list(comments[:limit])
        for idx, comment in enumerate(selected, 1):
            lines.append(_format_comment_section(idx, comment))
            lines.append("")
        remaining = len(comments) - len(selected)
        if remaining > 0:
            lines.append(f"...and {remaining} more comment(s) not shown here.")
            lines.append("")

    lines.append("---")
    lines.append("_Generated automatically by ryzl review service._")
    return "\n".join(line for line in lines if line is not None).strip()


def _build_diff_index(diff_text: str | None) -> DiffIndex:
    if not diff_text:
        return {}

    index: DiffIndex = defaultdict(set)
    current_file: str | None = None
    next_line: int | None = None

    for raw_line in diff_text.splitlines():
        line = raw_line.rstrip("\n")
        if line.startswith("diff --git"):
            current_file = None
            next_line = None
            continue
        if line.startswith("+++ b/"):
            current_file = line[6:].strip()
            continue
        if line.startswith("@@"):
            match = _HUNK_PATTERN.match(line)
            if not match:
                next_line = None
                continue
            next_line = int(match.group("new_start"))
            continue
        if current_file is None or next_line is None:
            continue
        if line.startswith("+++") or line.startswith("---"):
            continue
        if line.startswith("+"):
            index[current_file].add(next_line)
            next_line += 1
            continue
        if line.startswith("-"):
            continue
        if line.startswith("\\"):
            continue
        index[current_file].add(next_line)
        next_line += 1

    return index


def _comment_line_number(comment: ReviewComment) -> int | None:
    for candidate in (comment.line_number_end, comment.line_number_start):
        if candidate and int(candidate) > 0:
            return int(candidate)
    return None


def _can_map_inline(comment: ReviewComment, diff_index: DiffIndex) -> bool:
    if not comment.file_path:
        return False
    line = _comment_line_number(comment)
    if line is None:
        return False
    lines_for_file = diff_index.get(comment.file_path)
    if not lines_for_file:
        return False
    return line in lines_for_file


def _format_inline_body(comment: ReviewComment) -> str:
    severity = (comment.severity or "info").upper()
    category = (comment.category or "general").title()
    title = comment.title or f"{category} issue"

    sections = [f"**{title}** ({severity} · {category})", comment.body or "No description provided."]
    if comment.suggested_fix:
        sections.append(f"Suggested fix: {comment.suggested_fix}")
    if comment.agent:
        sections.append(f"Agent: {comment.agent}")
    return "\n\n".join(sections)


def _to_inline_comment_payload(comment: ReviewComment) -> Dict[str, Any]:
    line = _comment_line_number(comment)
    payload: Dict[str, Any] = {
        "path": comment.file_path,
        "line": line,
        "side": "RIGHT",
        "body": _format_inline_body(comment),
    }
    if (
        comment.line_number_start
        and comment.line_number_end
        and int(comment.line_number_end) > int(comment.line_number_start)
    ):
        payload["start_line"] = int(comment.line_number_start)
        payload["start_side"] = "RIGHT"
    return payload


def build_inline_review_comments(
    comments: Sequence[ReviewComment],
    diff_text: str | None,
    *,
    max_inline: int,
) -> Tuple[List[Dict[str, Any]], List[ReviewComment]]:
    diff_index = _build_diff_index(diff_text)
    inline_limit = max(0, max_inline or 0)
    inline_payloads: List[Dict[str, Any]] = []
    remainder: List[ReviewComment] = []

    for comment in comments:
        if len(inline_payloads) < inline_limit and _can_map_inline(comment, diff_index):
            payload = _to_inline_comment_payload(comment)
            if payload["line"] is not None:
                inline_payloads.append(payload)
                continue
        remainder.append(comment)

    return inline_payloads, remainder


def _submit_pull_request_review(
    repo: str,
    pr_number: int,
    *,
    summary_body: str,
    inline_comments: Sequence[Mapping[str, Any]],
) -> bool:
    client = get_github_client()
    payload: Dict[str, Any] = {
        "event": "COMMENT",
        "body": summary_body or "Automated review",
        "comments": list(inline_comments),
    }

    try:
        response = client.post(
            f"repos/{repo}/pulls/{pr_number}/reviews",
            json=payload,
        )
    except Exception:
        logger.exception("Failed to submit inline review to GitHub")
        return False

    if response.status_code >= 300:
        logger.warning(
            "GitHub inline review failed for %s#%s (status %s): %s",
            repo,
            pr_number,
            response.status_code,
            response.text,
        )
        return False

    logger.info(
        "Submitted inline review to GitHub for %s#%s (%d inline comment(s))",
        repo,
        pr_number,
        len(inline_comments),
    )
    return True


def _post_issue_comment(repo: str, pr_number: int, body: str) -> None:
    if not body:
        return

    client = get_github_client()
    try:
        response = client.post(
            f"repos/{repo}/issues/{pr_number}/comments",
            json={"body": body},
        )
    except Exception:
        logger.exception("Failed to sync review comments to GitHub issue thread")
        return

    if response.status_code >= 300:
        logger.warning(
            "GitHub comment sync failed for %s#%s (status %s): %s",
            repo,
            pr_number,
            response.status_code,
            response.text,
        )
    else:
        logger.info("Synced review summary comment to GitHub for %s#%s", repo, pr_number)


def sync_review_to_github(
    review,
    summary: str | None,
    comments: List[ReviewComment],
    metadata: Mapping[str, Any] | None = None,
) -> None:
    settings = get_settings()
    if not settings.github_comment_sync_enabled:
        return
    if getattr(review, "source", None) != "github":
        return

    repo = getattr(review, "repo", None)
    pr_number_raw = getattr(review, "pr_number", None)
    if not repo or not pr_number_raw:
        logger.debug("Skipping GitHub sync due to missing repo/pr metadata")
        return

    try:
        pr_number = int(pr_number_raw)
    except (TypeError, ValueError):
        logger.warning("Skipping GitHub sync: invalid PR number %s", pr_number_raw)
        return

    diff_snapshot = getattr(review, "diff_snapshot", None)
    inline_limit = getattr(settings, "github_comment_max_inline", 0) or 0
    inline_payloads, remainder = build_inline_review_comments(
        comments,
        diff_snapshot,
        max_inline=inline_limit,
    )

    summary_body = build_github_comment_body(
        summary,
        remainder,
        max_list_items=inline_limit if inline_limit else len(remainder),
        metadata=metadata,
        inline_posted=len(inline_payloads),
        total_comments=len(comments),
    )

    if inline_payloads and _submit_pull_request_review(
        repo,
        pr_number,
        summary_body=summary_body,
        inline_comments=inline_payloads,
    ):
        return

    fallback_body = build_github_comment_body(
        summary,
        comments,
        max_list_items=inline_limit if inline_limit else len(comments),
        metadata=metadata,
        inline_posted=0,
        total_comments=len(comments),
    )
    _post_issue_comment(repo, pr_number, fallback_body)
