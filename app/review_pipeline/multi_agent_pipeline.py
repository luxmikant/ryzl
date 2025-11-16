"""Deterministic multi-agent review pipeline used for Day 3."""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
import re
from typing import Dict, List, Sequence, Tuple

from app.schemas.review_schemas import ReviewComment


@dataclass
class ParsedFile:
    path: str
    additions: List[Tuple[int, str]] = field(default_factory=list)
    deletions: List[Tuple[int, str]] = field(default_factory=list)


def _parse_unified_diff(diff: str) -> List[ParsedFile]:
    files: List[ParsedFile] = []
    current: ParsedFile | None = None
    current_line = 0

    for line in diff.splitlines():
        if line.startswith("diff --git"):
            if current:
                files.append(current)
            current = ParsedFile(path="unknown")
            current_line = 0
            continue

        if line.startswith("+++"):
            if current:
                normalized = line.replace("+++ b/", "", 1).replace("+++ ", "", 1)
                current.path = normalized
            continue

        if line.startswith("@@"):
            match = re.search(r"\+(\d+)", line)
            current_line = int(match.group(1)) if match else 0
            continue

        if line.startswith("+") and not line.startswith("+++"):
            if current:
                current.additions.append((current_line or 1, line[1:]))
                current_line += 1
            continue

        if line.startswith("-") and not line.startswith("---"):
            if current:
                current.deletions.append((current_line or 1, line[1:]))
            continue

        if current_line:
            current_line += 1

    if current:
        files.append(current)

    return [file for file in files if file.path != "unknown" or file.additions or file.deletions]


class BaseAgent:
    name: str = "base-agent"

    def run(self, files: Sequence[ParsedFile]) -> List[ReviewComment]:  # pragma: no cover - interface
        raise NotImplementedError


class ComplexityAgent(BaseAgent):
    name = "complexity-agent"

    def run(self, files: Sequence[ParsedFile]) -> List[ReviewComment]:
        comments: List[ReviewComment] = []
        for file in files:
            for line_no, line in file.additions:
                if len(line) > 120:
                    comments.append(
                        ReviewComment(
                            agent=self.name,
                            file_path=file.path,
                            line_number_start=line_no,
                            line_number_end=line_no,
                            category="maintainability",
                            severity="warning",
                            title="Long line may hurt readability",
                            body="Consider breaking this statement into smaller chunks or helper functions.",
                            suggested_fix="Wrap the logic across multiple lines or extract helpers.",
                        )
                    )
        return comments


class DebugArtifactAgent(BaseAgent):
    name = "debug-artifact-agent"

    def run(self, files: Sequence[ParsedFile]) -> List[ReviewComment]:
        comments: List[ReviewComment] = []
        for file in files:
            for line_no, line in file.additions:
                lowered = line.lower()
                if "todo" in lowered or "fixme" in lowered:
                    severity = "info"
                    comments.append(
                        ReviewComment(
                            agent=self.name,
                            file_path=file.path,
                            line_number_start=line_no,
                            line_number_end=line_no,
                            category="project-management",
                            severity=severity,
                            title="Leftover TODO/FIXME",
                            body="Track TODOs in an issue instead of shipping them in code.",
                            suggested_fix="Open an issue and remove the inline TODO before merge.",
                        )
                    )
                if "print(" in line and "test" not in file.path.lower():
                    comments.append(
                        ReviewComment(
                            agent=self.name,
                            file_path=file.path,
                            line_number_start=line_no,
                            line_number_end=line_no,
                            category="observability",
                            severity="info",
                            title="Debug print detected",
                            body="Prefer structured logging over bare print statements in production modules.",
                            suggested_fix="Use the shared logger from app.core instead of print().",
                        )
                    )
        return comments


class SecurityAgent(BaseAgent):
    name = "security-agent"
    _dangerous_tokens = ("eval(", "exec(", "os.system(", "subprocess.Popen", "SECRET_KEY", "password=")

    def run(self, files: Sequence[ParsedFile]) -> List[ReviewComment]:
        comments: List[ReviewComment] = []
        for file in files:
            for line_no, line in file.additions:
                if any(token in line for token in self._dangerous_tokens):
                    comments.append(
                        ReviewComment(
                            agent=self.name,
                            file_path=file.path,
                            line_number_start=line_no,
                            line_number_end=line_no,
                            category="security",
                            severity="warning",
                            title="Potential insecure call",
                            body=(
                                "The diff introduces a pattern that often leads to security issues."
                                " Validate inputs or leverage safer helpers."
                            ),
                            suggested_fix="Replace the insecure call with a vetted helper or sanitize inputs first.",
                        )
                    )
        return comments


class TestingCoverageAgent(BaseAgent):
    name = "testing-agent"

    def run(self, files: Sequence[ParsedFile]) -> List[ReviewComment]:
        if not files:
            return []

        code_files = [f for f in files if f.path.endswith(".py") and "test" not in f.path.lower()]
        tests_touched = any("test" in f.path.lower() for f in files)
        comments: List[ReviewComment] = []
        if code_files and not tests_touched:
            target = code_files[0]
            comments.append(
                ReviewComment(
                    agent=self.name,
                    file_path=target.path,
                    line_number_start=1,
                    line_number_end=5,
                    category="testing",
                    severity="info",
                    title="No accompanying tests",
                    body="Application code changed but no tests were updated. Consider adding coverage for regressions.",
                    suggested_fix="Add or update tests in tests/ to cover the new behavior.",
                )
            )
        return comments


AGENTS: Tuple[BaseAgent, ...] = (
    ComplexityAgent(),
    DebugArtifactAgent(),
    SecurityAgent(),
    TestingCoverageAgent(),
)


def _build_summary(metadata: Dict[str, object], files: Sequence[ParsedFile]) -> str:
    file_count = metadata.get("files_reviewed", len(files))
    comment_count = metadata.get("total_comments", 0)
    severity_breakdown: Dict[str, int] = metadata.get("severity_breakdown", {})  # type: ignore[assignment]
    parts = [
        f"Multi-agent review touched {file_count} file(s) and produced {comment_count} actionable insight(s)."
    ]
    if severity_breakdown:
        bucket = ", ".join(f"{level}:{count}" for level, count in severity_breakdown.items())
        parts.append(f"Severity mix -> {bucket}.")
    if metadata.get("categories_detected"):
        categories = ", ".join(metadata["categories_detected"])  # type: ignore[index]
        parts.append(f"Focus areas: {categories}.")
    return " ".join(parts)


def run_multi_agent_review(diff: str | None) -> Tuple[str, List[ReviewComment], Dict[str, object]]:
    if not diff:
        metadata = {
            "agents_run": [agent.name for agent in AGENTS],
            "total_comments": 0,
            "files_reviewed": 0,
            "severity_breakdown": {},
            "categories_detected": [],
        }
        return ("No diff provided; multi-agent review skipped.", [], metadata)

    parsed_files = _parse_unified_diff(diff)
    comments: List[ReviewComment] = []
    for agent in AGENTS:
        agent_comments = agent.run(parsed_files)
        comments.extend(agent_comments)

    severity_counter = Counter(comment.severity for comment in comments)
    categories = sorted({comment.category for comment in comments})
    metadata = {
        "agents_run": [agent.name for agent in AGENTS],
        "total_comments": len(comments),
        "files_reviewed": len(parsed_files),
        "severity_breakdown": dict(severity_counter),
        "categories_detected": categories,
    }

    summary = _build_summary(metadata, parsed_files)
    return summary, comments, metadata