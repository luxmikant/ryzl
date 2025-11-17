"""Check status of a review request."""
import httpx
import json
import sys
from dotenv import load_dotenv
import os

load_dotenv()

API_URL = "http://localhost:8000"
SERVICE_KEY = os.getenv("SERVICE_API_KEY", "replace-with-service-key")

if len(sys.argv) < 2:
    print("Usage: python check_review.py <review_id>")
    sys.exit(1)

review_id = sys.argv[1]
url = f"{API_URL}/api/v1/reviews/{review_id}"

with httpx.Client() as client:
    response = client.get(url)

print(f"Status: {response.status_code}")
print(json.dumps(response.json(), indent=2))
