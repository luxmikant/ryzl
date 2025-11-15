import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text

from app.core.db import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class ReviewResult(Base):
    __tablename__ = "review_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    review_request_id = Column(String, ForeignKey("review_requests.id"), unique=True, nullable=False)
    summary = Column(Text, nullable=True)
    raw_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
