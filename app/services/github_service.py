from __future__ import annotations

from typing import Dict, Optional

from app.services.github_client import get_github_client


class GitHubAPIError(Exception):
    """Raised when GitHub returns an unsuccessful response."""

    def __init__(self, status_code: int, message: Optional[str] = None) -> None:
        self.status_code = status_code
        self.message = message or "GitHub API request failed"
        super().__init__(f"{self.message} (status={status_code})")


def fetch_pr_diff(repo_full_name: str, pr_number: int) -> str:
    """Fetch the unified diff for a pull request.

    Args:
        repo_full_name: "owner/repo" string identifying the repository.
        pr_number: Pull request number.

    Returns:
        Unified diff text for the PR.

    Raises:
        GitHubAPIError: if GitHub returns any non-200 status code.
    """

    client = get_github_client()
    path = f"repos/{repo_full_name}/pulls/{pr_number}"
    headers: Dict[str, str] = {"Accept": "application/vnd.github.v3.diff"}
    response = client.get(path, headers=headers)
    if response.status_code != 200:
        raise GitHubAPIError(response.status_code, response.text)
    return response.text
*** End Patch