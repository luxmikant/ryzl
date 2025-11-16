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

Relevant keys:

- `DATABASE_URL` – defaults to `sqlite:///./reviews.db` for local dev
- `OPENAI_API_KEY` – placeholder for later LLM integration

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

### 7. Start the review worker

In a separate terminal (same virtualenv), run the RQ worker so queued reviews get processed:

```cmd
python -m app.workers.run_worker
```

The worker will connect to Redis using `REDIS_URL` and execute jobs from the `reviews` queue.

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

## Roadmap

1. **Day 1 (complete):** Core FastAPI project, SQLite models, review endpoints.
2. **Day 2 (complete):** Redis + RQ queue, worker process, stubbed pipeline returning structured comments.
3. **Day 3 (current):** Multi-agent review pipeline with agent-level metadata, richer response schema, and worker observability logs.

Feel free to keep running the current API for manual testing while the queue/worker enhancements are built.
