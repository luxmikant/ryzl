import redis
from rq import Queue
import sys

from app.core.config import get_settings

settings = get_settings()

redis_conn = redis.from_url(settings.redis_url)

# Disable timeout on Windows (no SIGALRM support)
timeout = -1 if sys.platform == "win32" else 300
review_queue = Queue("reviews", connection=redis_conn, default_timeout=timeout)
