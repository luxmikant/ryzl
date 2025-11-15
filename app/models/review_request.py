import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String, Text

from app.core.db import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class ReviewRequest(Base):
    __tablename__ = "review_requests"

    id = Column(String, primary_key=True, default=generate_uuid)
    source = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    diff_snapshot = Column(Text, nullable=True)
    repo = Column(String, nullable=True)
    pr_number = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
