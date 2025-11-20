import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { GitPullRequest, ArrowRight, AlertCircle, Loader2, Github } from 'lucide-react';
import { apiClient } from '../api/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../components/ui/alert';

export function GitHubSubmitPage() {
  const navigate = useNavigate();
  const [repoFullName, setRepoFullName] = useState('');
  const [prNumber, setPrNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!repoFullName.trim() || !prNumber.trim()) {
      setError('Please provide both repository name and PR number');
      return;
    }

    if (!apiClient.getApiKey()) {
      setError('API key not configured. Please set your API key in Settings.');
      return;
    }

    const prNum = parseInt(prNumber, 10);
    if (isNaN(prNum) || prNum <= 0) {
      setError('Invalid PR number');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const review = await apiClient.createReview({
        source: 'github',
        repo_full_name: repoFullName.trim(),
        pull_request_number: prNum
      });

      toast.success('GitHub PR review started!');
      navigate(`/review/${review.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create review';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--cockpit-purple)] to-[var(--cockpit-cyan)] flex items-center justify-center">
              <GitPullRequest className="w-6 h-6 text-background" />
            </div>
            <div>
              <h1 className="text-3xl mb-1">GitHub PR Review</h1>
              <p className="text-muted-foreground">Connect a pull request for automated code review</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <Card className="p-6 mb-6 border-[var(--cockpit-purple)]/30 bg-[var(--cockpit-purple)]/5">
          <h3 className="mb-3 flex items-center gap-2">
            <Github className="w-5 h-5 text-[var(--cockpit-purple)]" />
            How it works
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Provide your GitHub repository and PR number:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Repository format: <code className="px-2 py-1 bg-background/50 rounded text-xs">owner/repo</code></li>
              <li>Example: <code className="px-2 py-1 bg-background/50 rounded text-xs">facebook/react</code></li>
              <li>PR number: Just the numeric ID (e.g., <code className="px-2 py-1 bg-background/50 rounded text-xs">42</code>)</li>
            </ul>
            <p className="mt-3 text-[var(--cockpit-cyan)]">
              Comments will be synced back to GitHub if enabled in your configuration.
            </p>
          </div>
        </Card>

        {/* Form */}
        <Card className="p-6 mb-6">
          <div className="space-y-6">
            <div>
              <label className="block mb-2">
                <span className="text-sm text-muted-foreground">Repository Full Name</span>
              </label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={repoFullName}
                  onChange={(e) => setRepoFullName(e.target.value)}
                  placeholder="owner/repository"
                  className="pl-11"
                  disabled={submitting}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Format: owner/repo (e.g., microsoft/vscode)
              </p>
            </div>

            <div>
              <label className="block mb-2">
                <span className="text-sm text-muted-foreground">Pull Request Number</span>
              </label>
              <div className="relative">
                <GitPullRequest className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="number"
                  value={prNumber}
                  onChange={(e) => setPrNumber(e.target.value)}
                  placeholder="42"
                  className="pl-11"
                  disabled={submitting}
                  min="1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                The numeric ID of the pull request
              </p>
            </div>

            {repoFullName && prNumber && (
              <div className="p-3 rounded-lg bg-accent/50 border border-border">
                <div className="text-xs text-muted-foreground mb-1">Preview URL:</div>
                <a
                  href={`https://github.com/${repoFullName}/pull/${prNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--cockpit-cyan)] hover:underline font-mono"
                >
                  https://github.com/{repoFullName}/pull/{prNumber}
                </a>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRepoFullName('facebook/react');
                  setPrNumber('12345');
                }}
                disabled={submitting}
              >
                Load Example
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !repoFullName.trim() || !prNumber.trim()}
                className="bg-gradient-to-r from-[var(--cockpit-purple)] to-[var(--cockpit-cyan)]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting Review...
                  </>
                ) : (
                  <>
                    Start Review
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-[var(--cockpit-purple)]/30">
            <div className="text-[var(--cockpit-purple)] mb-2">GitHub Integration</div>
            <p className="text-sm text-muted-foreground">
              Automatically fetches PR diff and metadata from GitHub for seamless review
            </p>
          </Card>
          <Card className="p-4 border-[var(--cockpit-cyan)]/30">
            <div className="text-[var(--cockpit-cyan)] mb-2">Comment Sync</div>
            <p className="text-sm text-muted-foreground">
              Review comments can be posted back to your PR as inline code comments
            </p>
          </Card>
          <Card className="p-4 border-[var(--cockpit-green)]/30">
            <div className="text-[var(--cockpit-green)] mb-2">Workflow Ready</div>
            <p className="text-sm text-muted-foreground">
              Perfect for CI/CD pipelines and automated code quality checks
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
