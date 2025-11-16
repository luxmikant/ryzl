from __future__ import annotations

from dataclasses import dataclass
from typing import List, Protocol, Tuple

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


def get_orchestrator(mode: str) -> ReviewOrchestrator:
    normalized = (mode or "").strip().lower()
    if normalized == "stub":
        return StubOrchestrator()
    return HeuristicOrchestrator()
