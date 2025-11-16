from app.review_pipeline.orchestrator import get_orchestrator, HeuristicOrchestrator, StubOrchestrator


def test_get_orchestrator_stub():
    orchestrator = get_orchestrator("stub")
    assert isinstance(orchestrator, StubOrchestrator)


def test_get_orchestrator_default():
    orchestrator = get_orchestrator("multi-agent")
    assert isinstance(orchestrator, HeuristicOrchestrator)
