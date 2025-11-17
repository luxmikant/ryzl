from app.review_pipeline.orchestrator import (
    get_orchestrator,
    HeuristicOrchestrator,
    LLMOrchestrator,
    StubOrchestrator,
)


def test_get_orchestrator_stub():
    orchestrator = get_orchestrator("stub")
    assert isinstance(orchestrator, StubOrchestrator)


def test_get_orchestrator_default():
    orchestrator = get_orchestrator("multi-agent")
    assert isinstance(orchestrator, HeuristicOrchestrator)


def test_get_orchestrator_llm(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "mock")
    monkeypatch.setenv("LLM_DETERMINISTIC", "true")
    orchestrator = get_orchestrator("llm")
    assert isinstance(orchestrator, LLMOrchestrator)

    diff = "diff --git a/foo.py b/foo.py\n@@\n+print('hello')"
    summary, comments, metadata = orchestrator.run(diff)

    assert comments, "LLM orchestrator should return mock comments"
    assert comments[0].agent == "llm-mock-agent"
    assert metadata["agents_run"]
