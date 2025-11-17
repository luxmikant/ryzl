import json

from app.llm.client import LLMClient


def test_llm_client_mock_response(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "mock")
    monkeypatch.setenv("LLM_DETERMINISTIC", "true")

    client = LLMClient()
    response = client.generate("sys", "user")

    body = json.loads(response.content)
    assert body["summary"] == "Mock summary for testing."
    assert body["comments"][0]["agent"] == "llm-mock-agent"
    assert response.tokens_prompt == 100
    assert response.tokens_completion == 50
    assert response.latency_ms == 5.0