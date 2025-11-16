from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreateRequest(BaseModel):
    source: str = Field(..., description="Source of the review request, e.g. github or manual")
    diff: Optional[str] = Field(None, description="Raw git diff payload for manual submissions")
    repo: Optional[str] = Field(None, description="Repository identifier when source is github")
    pr_number: Optional[int] = Field(None, description="Pull request number when source is github")


class ReviewComment(BaseModel):
    agent: Optional[str] = Field(
        default=None, description="Name of the agent or heuristic that produced the comment"
    )
    file_path: str
    line_number_start: int
    line_number_end: int
    category: str
    severity: str
    title: str
    body: str
    suggested_fix: Optional[str] = None


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    summary: Optional[str]
    comments: List[ReviewComment] = Field(default_factory=list)
    agents: List[str] = Field(default_factory=list)
    metrics: Optional["ReviewMetrics"] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ReviewMetrics(BaseModel):
    total_comments: int
    files_reviewed: int
    severity_breakdown: Dict[str, int] = Field(default_factory=dict)
    categories_detected: List[str] = Field(default_factory=list)


ReviewResponse.model_rebuild()
