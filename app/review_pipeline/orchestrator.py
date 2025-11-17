from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass, field
from typing import List, Protocol, Tuple

from app.llm.client import LLMClient
from app.review_pipeline.multi_agent_pipeline import run_multi_agent_review
from app.review_pipeline.stub_pipeline import run_stubbed_review
from app.schemas.review_schemas import ReviewComment


class ReviewOrchestrator(Protocol):
    def run(self, diff: str | None) -> Tuple[str, List[ReviewComment], dict]:
        """Execute the review pipeline and return summary, comments, metadata."""


@dataclass
class StubOrchestrator:
    def run(self, diff: str | None) -> Tuple[str, List[ReviewComment], dict]:
        return run_stubbed_review(diff)


@dataclass
class HeuristicOrchestrator:
    def run(self, diff: str | None) -> Tuple[str, List[ReviewComment], dict]:
        return run_multi_agent_review(diff)


@dataclass
class LLMOrchestrator:
    client: LLMClient = field(default_factory=LLMClient)

    def run(self, diff: str | None) -> Tuple[str, List[ReviewComment], dict]:
        if not diff:
            metadata = {
                "agents_run": ["llm-orchestrator"],
                "total_comments": 0,
                "files_reviewed": 0,
                "severity_breakdown": {},
                "categories_detected": [],
            }
            return ("No diff provided; LLM review skipped.", [], metadata)

        system_prompt = (
            "You are the lead engineer coordinating a team of code reviewers. "
            "Return JSON with `summary`, `comments`, and `agents` fields."
        )
        user_prompt = (
            "Analyze the following git diff and produce structured review comments. "
            "Each comment should include file_path, line_number_start, line_number_end, "
            "category, severity, title, body, suggested_fix, and agent.\n\n"
            f"Diff:\n{diff}\n"
        )

        response = self.client.generate(system_prompt, user_prompt)
        comments: List[ReviewComment] = []
        agents: List[str] = []
        summary = "LLM review completed."

        try:
            payload = json.loads(response.content)
            summary = payload.get("summary", summary)
            raw_comments = payload.get("comments", [])
            agents = [str(agent) for agent in payload.get("agents", [])]
            if isinstance(raw_comments, list):
                comments = [ReviewComment(**comment) for comment in raw_comments]
        except json.JSONDecodeError:
            summary = "LLM returned invalid JSON; please inspect logs."

        severity_counter = Counter(comment.severity for comment in comments)
        file_count = diff.count("diff --git") or 1
        categories = sorted({comment.category for comment in comments})
        metadata = {
            "agents_run": agents or ["llm-orchestrator"],
            "total_comments": len(comments),
            "files_reviewed": file_count,
            "severity_breakdown": dict(severity_counter),
            "categories_detected": categories,
            "tokens_prompt": response.tokens_prompt,
            "tokens_completion": response.tokens_completion,
            "latency_ms": response.latency_ms,
        }

        return summary, comments, metadata


def get_orchestrator(mode: str) -> ReviewOrchestrator:
    normalized = (mode or "").strip().lower()
    if normalized == "stub":
        return StubOrchestrator()
    if normalized == "llm":
        return LLMOrchestrator()
    return HeuristicOrchestrator()
