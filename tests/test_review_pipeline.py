import textwrap

from app.review_pipeline.multi_agent_pipeline import run_multi_agent_review
from app.review_pipeline.stub_pipeline import run_stubbed_review


MULTI_AGENT_DIFF = textwrap.dedent(
    """
    diff --git a/app/sample.py b/app/sample.py
    --- a/app/sample.py
    +++ b/app/sample.py
    @@ -1,3 +1,12 @@
    +def risky_eval(payload):
    +    # TODO: remove before merging
    +    eval("print(payload)")
    +    print("debug info", payload)
    +    very_long_assignment = "This string is intentionally very long to trigger the complexity agent because it exceeds the 120 character threshold used for heuristics; please split it."
    +    return payload
    +
    +def untouched_helper():
    +    return "still short"
    """
)


def test_multi_agent_pipeline_emits_agent_metadata():
    summary, comments, metadata = run_multi_agent_review(MULTI_AGENT_DIFF)

    assert "Multi-agent review" in summary
    assert metadata["files_reviewed"] == 1
    assert metadata["total_comments"] >= 4

    expected_agents = {
        "complexity-agent",
        "debug-artifact-agent",
        "security-agent",
        "testing-agent",
    }
    assert set(metadata["agents_run"]) == expected_agents
    assert expected_agents.issuperset({comment.agent for comment in comments if comment.agent})

    categories = {comment.category for comment in comments}
    assert {"maintainability", "project-management", "security", "testing"}.issubset(categories)


def test_stub_pipeline_returns_placeholder_metadata():
    summary, comments, metadata = run_stubbed_review("diff --git a/file b/file")

    assert "stub" in summary.lower()
    assert metadata["agents_run"] == ["stub-agent"]
    assert metadata["total_comments"] == 1
    assert comments[0].agent == "stub-agent"


def test_stub_pipeline_handles_missing_diff():
    summary, comments, metadata = run_stubbed_review(None)

    assert "unable to perform" in summary.lower()
    assert comments == []
    assert metadata["total_comments"] == 0
    assert metadata["files_reviewed"] == 0
