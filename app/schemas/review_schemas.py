from typing import List, Optional

from pydantic import BaseModel, Field


class ReviewCreateRequest(BaseModel):
    source: str = Field(..., description="Source of the review request, e.g. github or manual")
    diff: Optional[str] = Field(None, description="Raw git diff payload for manual submissions")
    repo: Optional[str] = Field(None, description="Repository identifier when source is github")
    pr_number: Optional[int] = Field(None, description="Pull request number when source is github")


class ReviewComment(BaseModel):
    file_path: str
    line_number_start: int
    line_number_end: int
    category: str
    severity: str
    title: str
    body: str
    suggested_fix: Optional[str] = None


class ReviewResponse(BaseModel):
    id: str
    status: str
    summary: Optional[str]
    comments: List[ReviewComment] = Field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        orm_mode = True
