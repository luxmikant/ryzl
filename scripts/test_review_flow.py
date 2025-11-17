"""
Quick test to submit a review request and monitor the worker.
Run this after starting the API server and worker.
"""
import httpx
import time
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = "http://localhost:8000"
SERVICE_KEY = os.getenv("SERVICE_API_KEY", "replace-with-service-key")

def submit_review():
    """Submit a review request."""
    url = f"{API_URL}/api/v1/reviews"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": SERVICE_KEY
    }
    payload = {
        "source": "github",
        "repo": "luxmikant/ryzl",
        "pr_number": 1,
        "diff": None  # Worker will fetch from GitHub
    }
    
    print(f"📤 Submitting review request for PR luxmikant/ryzl#1...")
    with httpx.Client() as client:
        response = client.post(url, json=payload, headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json()

def check_metrics():
    """Check Prometheus metrics for LLM calls."""
    url = f"{API_URL}/metrics"
    print(f"\n📊 Checking metrics at {url}...")
    with httpx.Client() as client:
        response = client.get(url)
    
    # Filter for LLM-related metrics
    for line in response.text.split('\n'):
        if 'llm_' in line.lower() and not line.startswith('#'):
            print(line)

if __name__ == "__main__":
    print("🚀 Testing PR Review Flow\n")
    print("Make sure the following are running:")
    print("  1. API server: uvicorn app.main:app --reload")
    print("  2. Redis: docker-compose up -d redis")
    print("  3. Worker: python -m app.workers.run_worker")
    print("  4. LLM_PROVIDER set in .env (openai or azure)")
    print()
    
    result = submit_review()
    
    print("\n⏳ Wait 5-10 seconds for worker to process...")
    print("   Watch the worker terminal for LLM calls and results.")
    time.sleep(3)
    
    check_metrics()
    
    print("\n✅ Done! Check:")
    print(f"   - Worker logs for LLM generation")
    print(f"   - GitHub PR comments at https://github.com/luxmikant/ryzl/pull/1")
    print(f"   - Metrics at {API_URL}/metrics")
