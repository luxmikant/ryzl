from rq import SimpleWorker, Worker
from rq.timeouts import TimerDeathPenalty
import sys

from app.workers.queue import redis_conn


class WindowsWorker(SimpleWorker):
    """RQ worker variant that works on Windows."""

    death_penalty_class = TimerDeathPenalty


def main() -> None:
    worker_class = WindowsWorker if sys.platform == "win32" else Worker
    worker = worker_class(["reviews"], connection=redis_conn)
    worker.work(with_scheduler=True)


if __name__ == "__main__":
    main()
