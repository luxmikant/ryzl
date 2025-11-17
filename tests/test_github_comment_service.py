from types import SimpleNamespace

from app.schemas.review_schemas import ReviewComment
from app.services import github_comment_service as svc

SAMPLE_DIFF = """diff --git a/app/example.py b/app/example.py
index 1111111..2222222 100644
--- a/app/example.py
+++ b/app/example.py
@@ -8,3 +10,6 @@ def sample():
 context-line
+new line 10
+new line 11
+new line 12
 context-end
"""


def _make_comment(title: str) -> ReviewComment:
    return ReviewComment(
        agent="test-agent",
        file_path="app/example.py",
        line_number_start=10,
        line_number_end=12,
        category="logic",
        severity="high",
        title=title,
        body=f"Details for {title}",
        suggested_fix="Consider refactoring.",
    )


class DummyReview:
    def __init__(
        self,
        source: str = "github",
        repo: str | None = "owner/repo",
        pr_number: str | None = "5",
        diff_snapshot: str | None = SAMPLE_DIFF,
    ) -> None:
        self.source = source
        self.repo = repo
        self.pr_number = pr_number
        self.diff_snapshot = diff_snapshot


class DummyResponse:
    def __init__(self, status_code: int = 201, text: str = "created") -> None:
        self.status_code = status_code
        self.text = text


class DummyClient:
    def __init__(self, statuses: dict[str, int] | None = None) -> None:
        self.calls: list[tuple[str, dict | None]] = []
        self.statuses = statuses or {}

    def post(self, path: str, *, json: dict | None = None, headers=None):
        self.calls.append((path, json))
        status = self.statuses.get(path, 201)
        text = "ok" if status < 300 else "error"
        return DummyResponse(status_code=status, text=text)


def test_build_body_limits_comment_count():
    comments = [_make_comment("First"), _make_comment("Second")]
    body = svc.build_github_comment_body(
        "Summary text",
        comments,
        max_list_items=1,
        metadata={"severity_breakdown": {"high": 2}},
        total_comments=len(comments),
    )

    assert "Summary text" in body
    assert "First" in body
    assert "Second" not in body
    assert "more comment" in body


def test_build_body_mentions_inline_note():
    body = svc.build_github_comment_body(
        "Summary",
        [],
        max_list_items=0,
        inline_posted=2,
        total_comments=5,
    )

    assert "Posted 2 inline comment" in body
    assert "No additional issues" in body


def test_sync_review_posts_inline_review(monkeypatch):
    review = DummyReview()
    comments = [_make_comment("Only finding")]
    settings = SimpleNamespace(github_comment_sync_enabled=True, github_comment_max_inline=5)

    client = DummyClient()
    monkeypatch.setattr(svc, "get_settings", lambda: settings)
    monkeypatch.setattr(svc, "get_github_client", lambda: client)

    svc.sync_review_to_github(review, "Automated summary", comments, {"total_comments": 1})

    assert client.calls, "Expected GitHub client to be invoked"
    path, payload = client.calls[0]
    assert path == "repos/owner/repo/pulls/5/reviews"
    assert payload["comments"][0]["path"] == "app/example.py"
    assert "Automated summary" in payload["body"]


def test_sync_review_falls_back_to_issue_comment_when_no_inline(monkeypatch):
    review = DummyReview(diff_snapshot=None)
    comments = [_make_comment("Fallback")]
    settings = SimpleNamespace(github_comment_sync_enabled=True, github_comment_max_inline=5)

    client = DummyClient()
    monkeypatch.setattr(svc, "get_settings", lambda: settings)
    monkeypatch.setattr(svc, "get_github_client", lambda: client)

    svc.sync_review_to_github(review, "Summary", comments)

    assert client.calls, "Expected fallback issue comment"
    path, payload = client.calls[0]
    assert path == "repos/owner/repo/issues/5/comments"
    assert "Summary" in payload["body"]


def test_sync_review_falls_back_when_review_api_fails(monkeypatch):
    review = DummyReview()
    comments = [_make_comment("Inline but fails")]
    settings = SimpleNamespace(github_comment_sync_enabled=True, github_comment_max_inline=5)

    review_path = "repos/owner/repo/pulls/5/reviews"
    client = DummyClient(statuses={review_path: 500})
    monkeypatch.setattr(svc, "get_settings", lambda: settings)
    monkeypatch.setattr(svc, "get_github_client", lambda: client)

    svc.sync_review_to_github(review, "Summary", comments)

    assert len(client.calls) == 2
    assert client.calls[0][0] == review_path
    assert client.calls[1][0] == "repos/owner/repo/issues/5/comments"


def test_sync_review_skips_when_disabled(monkeypatch):
    review = DummyReview()
    comments = [_make_comment("Disabled path")]
    settings = SimpleNamespace(github_comment_sync_enabled=False, github_comment_max_inline=5)

    def _unexpected_call():
        raise AssertionError("GitHub client should not be created when sync is disabled")

    monkeypatch.setattr(svc, "get_settings", lambda: settings)
    monkeypatch.setattr(svc, "get_github_client", _unexpected_call)

    svc.sync_review_to_github(review, "Summary", comments)