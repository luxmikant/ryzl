# PR Review Backend

A FastAPI-based backend service for automated pull request review insights. This repo is built in phases—Day 1 covers the basic API + persistence, later phases add queues, workers, and multi-agent LLM analysis.

## Getting Started

### 1. Create and activate a virtual environment

```cmd
python -m venv .venv
.venv\Scripts\activate
```

### 2. Install dependencies

```cmd
pip install -r requirements.txt
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and adjust values if needed (defaults to SQLite):

```cmd
copy .env.example .env
```

Key settings to review:

- `SERVICE_API_KEY` – shared secret required for POST requests.
- `DATABASE_URL` – defaults to `sqlite:///./reviews.db`; point to Postgres/MySQL in production.
- `REDIS_URL` – connection string consumed by the worker and rate limiter.
- `GITHUB_*` – App credentials + webhook secret for GitHub integrations.
- `GITHUB_COMMENT_SYNC_ENABLED` / `GITHUB_COMMENT_MAX_INLINE` – turn on inline comment publishing.
- `LLM_*` – provider/model knobs for the orchestrator (stays `mock` for local dev).
- `LOG_LEVEL`, `ENABLE_PROMETHEUS_METRICS`, `PROMETHEUS_METRICS_PATH` – runtime observability controls.

### 4. Start Redis

This project uses Redis + RQ for background review processing. You can run Redis locally via Docker:

```cmd
docker run --name redis -p 6379:6379 -d redis:7
```

Or install Redis for Windows via WSL/Chocolatey—any instance reachable at `redis://localhost:6379/0` works.

### 5. Initialize the database (first run only)

The app auto-creates tables on startup, but you can pre-create them via:

```cmd
python -c "from app.core.db import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 6. Run the API locally

```cmd
uvicorn app.main:app --reload
```

Visit http://localhost:8000/health to verify the service is running.
If Prometheus metrics are enabled (default), scrape http://localhost:8000/metrics.

### 7. Start the review worker

In a separate terminal (same virtualenv), run the RQ worker so queued reviews get processed:

```cmd
python -m app.workers.run_worker
```

The worker will connect to Redis using `REDIS_URL` and execute jobs from the `reviews` queue.

### 8. (Optional) Run everything via Docker Compose

```cmd
docker compose up --build
```

This brings up the API, worker, and Redis with health checks and restarts. Provide a `.env` file before running the stack.

## Configuration Reference

| Variable | Description | Default |
| --- | --- | --- |
| `DATABASE_URL` | SQLAlchemy connection string for persistence. Point to managed Postgres/MySQL in production. | `sqlite:///./reviews.db` |
| `REDIS_URL` | Redis connection string for queues and rate limiting. | `redis://redis:6379/0` |
| `SERVICE_API_KEY` | Static API key required on write endpoints (`X-API-Key`). | _(required)_ |
| `PIPELINE_MODE` | `multi-agent`, `llm`, or `stub` orchestrator selection. | `multi-agent` |
| `LLM_PROVIDER` / `LLM_MODEL` | Backend + model identifier for the LLM orchestration path. | `mock` / `gpt-4o-mini` |
| `LLM_DETERMINISTIC` | When `true`, returns canned responses for tests. | `true` |
| `OPENAI_API_KEY` / `OPENAI_ORGANIZATION` | Credentials for `LLM_PROVIDER=openai`. | empty |
| `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION` | Azure OpenAI settings for `LLM_PROVIDER=azure`. | empty |
| `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET` | GitHub App identity + webhook protection. | empty |
| `GITHUB_COMMENT_SYNC_ENABLED` | When `true`, push inline review comments back to PRs. | `false` |
| `GITHUB_COMMENT_MAX_INLINE` | Cap on inline comments per PR (remainder summarized). | `10` |
| `LOG_LEVEL` | Log verbosity for both API and worker. | `INFO` |
| `ENABLE_PROMETHEUS_METRICS` / `PROMETHEUS_METRICS_PATH` | Toggle and route for `/metrics`. | `true` / `/metrics` |

## Redis & Worker Quickstart

1. Launch Redis (Docker example shown above) and ensure the host/port match `REDIS_URL`.
2. Start the FastAPI process (`uvicorn app.main:app --reload`) so API requests can enqueue jobs.
3. In another terminal, run `python -m app.workers.run_worker` to consume the `reviews` queue.
4. Submit a manual review and watch the worker logs for `Processed review ...` to confirm everything is wired correctly.

When using Docker Compose, the `worker` service runs the same command and restarts on failure. For production, point `REDIS_URL` at a managed instance (Elasticache, Azure Cache, etc.) and run multiple workers for throughput.

## GitHub Comment Sync Setup

Inline feedback is disabled by default. To enable it:

1. Create a GitHub App or personal access token with `repo` scope (`pull_request:write` and `contents:read`).
2. Set `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY` (App private key or PAT), and `GITHUB_WEBHOOK_SECRET` in `.env`.
3. Flip `GITHUB_COMMENT_SYNC_ENABLED=true` and optionally tune `GITHUB_COMMENT_MAX_INLINE` (defaults to 10 inline comments per review).
4. Restart the API + worker processes so they pick up the new settings.

The worker will attempt inline comments first (via the Reviews API) and fall back to a single issue comment if line numbers cannot be mapped or GitHub rejects the review payload.

## Real LLM Provider Setup

By default, `LLM_PROVIDER=mock` and `LLM_DETERMINISTIC=true` for local dev/tests. To use real OpenAI or Azure OpenAI:

### OpenAI

1. Obtain an API key from [platform.openai.com](https://platform.openai.com/api-keys).
2. Set in `.env`:
   ```dotenv
   LLM_PROVIDER=openai
   LLM_DETERMINISTIC=false
   OPENAI_API_KEY=sk-...
   OPENAI_ORGANIZATION=org-...  # optional
   ```
3. Restart API + worker so they pick up the new settings.

### Azure OpenAI

1. Create an Azure OpenAI resource and deploy a model (e.g., `gpt-4o-mini`).
2. Copy the endpoint, API key, and deployment name from Azure Portal.
3. Set in `.env`:
   ```dotenv
   LLM_PROVIDER=azure
   LLM_DETERMINISTIC=false
   AZURE_OPENAI_API_KEY=...
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
   AZURE_OPENAI_DEPLOYMENT=your-deployment-name
   AZURE_OPENAI_API_VERSION=2024-02-15-preview
   ```
4. Restart API + worker.

### Testing Real Providers

Run the smoke test script (requires valid credentials in `.env`):

```cmd
python scripts\llm_smoke.py
```

Once working, `/metrics` will expose `llm_requests_total`, `llm_latency_seconds`, `llm_tokens_prompt`, and `llm_tokens_completion` metrics for your provider.

## API Usage

### Submit a review request

```cmd
curl -X POST http://localhost:8000/api/v1/reviews \
		 -H "Content-Type: application/json" \
		 -d "{\"source\": \"manual\", \"diff\": \"diff --git a/file.py b/file.py\n...\"}"
```

Response:

```json
{
	"id": "<uuid>",
	"status": "pending",
	"summary": null,
	"comments": []
}
```

### Retrieve review status/results

```cmd
curl http://localhost:8000/api/v1/reviews/<uuid>
```

Status transitions:

1. `pending` – right after POST, before the worker picks it up.
2. `running` – worker is executing the stub pipeline.
3. `completed` – stub pipeline finished and `comments` contains placeholder insights.
4. `failed` – job crashed; check worker logs.

Day 3 now ships with a deterministic multi-agent pipeline that tags each comment with the producing agent and surfaces aggregate metrics (`agents`, `metrics`) on the response payload. Set `PIPELINE_MODE=stub` in your environment if you need to fall back to the legacy deterministic stub.

## Observability & Deployment Notes


## Appendix: Quick Commands

```cmd
# Run redis locally (if not using compose)
docker run --name redis -p 6379:6379 -d redis:7

# Start API & worker in dev mode
uvicorn app.main:app --reload
python -m app.workers.run_worker

# Tail metrics (if enabled)
curl http://localhost:8000/metrics | head
```

## Roadmap

1. **Day 1 (complete):** Core FastAPI project, SQLite models, review endpoints.
2. **Day 2 (complete):** Redis + RQ queue, worker process, stubbed pipeline returning structured comments.
3. **Day 3 (current):** Multi-agent review pipeline with agent-level metadata, richer response schema, and worker observability logs.

Upcoming items include production-ready LLM provider wiring, GitHub inline review posting (complete), and deployment automation.

Feel free to keep running the current API for manual testing while the queue/worker enhancements are built.
