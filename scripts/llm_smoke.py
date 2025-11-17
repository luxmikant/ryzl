"""
Manual smoke test for real LLM providers.

Prerequisites:
1. Copy .env.example to .env
2. Set LLM_PROVIDER=openai (or azure)
3. Provide valid credentials (OPENAI_API_KEY or AZURE_* vars)
4. Set LLM_DETERMINISTIC=false

Run:
    python scripts/llm_smoke.py
"""
from app.llm.client import LLMClient

def main():
    client = LLMClient()
    
    system_prompt = "You are a helpful code reviewer."
    user_prompt = "Review this Python snippet: def add(a, b): return a + b"
    
    print(f"Testing LLM provider: {client.settings.llm_provider}")
    print(f"Model: {client.settings.llm_model}")
    print()
    
    try:
        response = client.generate(system_prompt, user_prompt)
        print(f"✓ Response received ({response.latency_ms:.0f}ms)")
        print(f"  Tokens: {response.tokens_prompt} prompt + {response.tokens_completion} completion")
        print(f"  Content preview: {response.content[:200]}...")
        print()
        print("Smoke test PASSED")
    except Exception as exc:
        print(f"✗ Smoke test FAILED: {exc}")
        raise

if __name__ == "__main__":
    main()
