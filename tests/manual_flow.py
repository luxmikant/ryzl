from pathlib import Path
import sys

import asyncio
import httpx
from httpx import ASGITransport

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from app.main import app
from app.workers.review_worker import process_review_job


async def run_manual_flow() -> None:
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        diff = "diff --git a/foo.py b/foo.py\n@@ -1,1 +1,2 @@\n-print('Hello')\n+print('Hello world')"

        post_resp = await client.post("/api/v1/reviews", json={"source": "manual", "diff": diff})
        post_resp.raise_for_status()
        created = post_resp.json()
        print("POST /api/v1/reviews ->", created)

        process_review_job(created["id"])

        get_resp = await client.get(f"/api/v1/reviews/{created['id']}")
        get_resp.raise_for_status()
        print("GET /api/v1/reviews/{id} ->", get_resp.json())


if __name__ == "__main__":
    asyncio.run(run_manual_flow())
