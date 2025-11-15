import redis
from rq import Queue

from app.core.config import get_settings

settings = get_settings()

redis_conn = redis.from_url(settings.redis_url)
review_queue = Queue("reviews", connection=redis_conn, default_timeout=300)
