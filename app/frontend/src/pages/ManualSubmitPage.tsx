import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { FileCode, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../components/ui/alert';

export function ManualSubmitPage() {
  const navigate = useNavigate();
  const [diff, setDiff] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!diff.trim()) {
      setError('Please provide a diff to review');
      return;
    }

    if (!apiClient.getApiKey()) {
      setError('API key not configured. Please set your API key in Settings.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const review = await apiClient.createReview({
        source: 'manual',
        diff: diff.trim()
      });

      toast.success('Review created successfully!');
      navigate(`/review/${review.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create review';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const exampleDiff = `diff --git a/src/api/users.ts b/src/api/users.ts
index 1234567..abcdefg 100644
--- a/src/api/users.ts
+++ b/src/api/users.ts
@@ -10,7 +10,7 @@ export async function getUser(id: string) {
-  const user = await db.query(\`SELECT * FROM users WHERE id = '\${id}'\`);
+  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
   return user;
 }`;

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--cockpit-cyan)] to-[var(--cockpit-purple)] flex items-center justify-center">
              <FileCode className="w-6 h-6 text-background" />
            </div>
            <div>
              <h1 className="text-3xl mb-1">Manual Diff Review</h1>
              <p className="text-muted-foreground">Submit a git diff for instant AI-powered analysis</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <Card className="p-6 mb-6 border-[var(--cockpit-cyan)]/30 bg-[var(--cockpit-cyan)]/5">
          <h3 className="mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[var(--cockpit-cyan)]" />
            How to generate a diff
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Generate a diff using git and paste it below:</p>
            <div className="bg-background/50 p-3 rounded-lg font-mono text-xs border border-border">
              <div>$ git diff HEAD~1 {'>'} changes.diff</div>
              <div className="text-[var(--cockpit-green)]"># or compare branches</div>
              <div>$ git diff main..feature-branch {'>'} changes.diff</div>
            </div>
            <p className="mt-3">The diff should include file paths, line numbers, and the actual changes.</p>
          </div>
        </Card>

        {/* Form */}
        <Card className="p-6 mb-6">
          <label className="block mb-3">
            <span className="text-sm text-muted-foreground">Diff Content</span>
          </label>
          
          <Textarea
            value={diff}
            onChange={(e) => setDiff(e.target.value)}
            placeholder={exampleDiff}
            className="min-h-[400px] font-mono text-sm mb-4"
          />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {diff.length} characters
              {diff.length > 0 && (
                <span className="ml-2">
                  ({(diff.length / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDiff(exampleDiff)}
                disabled={submitting}
              >
                Load Example
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !diff.trim()}
                className="bg-gradient-to-r from-[var(--cockpit-cyan)] to-[var(--cockpit-purple)]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
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
          <Card className="p-4 border-[var(--cockpit-cyan)]/30">
            <div className="text-[var(--cockpit-cyan)] mb-2">Fast Analysis</div>
            <p className="text-sm text-muted-foreground">
              Multi-agent pipeline processes your diff in parallel, typically completing in under 15 seconds
            </p>
          </Card>
          <Card className="p-4 border-[var(--cockpit-purple)]/30">
            <div className="text-[var(--cockpit-purple)] mb-2">Comprehensive</div>
            <p className="text-sm text-muted-foreground">
              Security, performance, style, and best practice analysis from specialized AI agents
            </p>
          </Card>
          <Card className="p-4 border-[var(--cockpit-green)]/30">
            <div className="text-[var(--cockpit-green)] mb-2">Actionable</div>
            <p className="text-sm text-muted-foreground">
              Receive line-by-line feedback with severity levels and suggested fixes
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
