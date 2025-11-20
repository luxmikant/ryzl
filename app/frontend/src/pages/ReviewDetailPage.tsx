import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ReviewRequest, Severity, Category } from '../types';
import { CommentItem } from '../components/review/CommentItem';
import { StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  ArrowLeft, 
  GitPullRequest, 
  FileCode, 
  Clock, 
  Users,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '../api/client';
import { toast } from 'sonner';

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<ReviewRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  useEffect(() => {
    if (id) {
      loadReview();
      // Poll for updates if status is pending or running
      const interval = setInterval(() => {
        if (review?.status === 'pending' || review?.status === 'running') {
          loadReview(true);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [id, review?.status]);

  const loadReview = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (!id) return;
      const data = await apiClient.getReview(id);
      setReview(data);
    } catch (error) {
      console.error('Failed to load review:', error);
      toast.error('Failed to load review');
      // Use mock data for demonstration
      setReview(mockReview);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--cockpit-cyan)]" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Review not found</p>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const files = Array.from(new Set(review.comments.map(c => c.file_path)));
  const filteredComments = review.comments.filter(c => {
    if (selectedFile !== 'all' && c.file_path !== selectedFile) return false;
    if (selectedSeverity !== 'all' && c.severity !== selectedSeverity) return false;
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (selectedAgent !== 'all' && c.agent !== selectedAgent) return false;
    return true;
  });

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                review.source === 'github' ? 'bg-[var(--cockpit-purple)]/20' : 'bg-[var(--cockpit-cyan)]/20'
              }`}>
                {review.source === 'github' ? (
                  <GitPullRequest className="w-6 h-6 text-[var(--cockpit-purple)]" />
                ) : (
                  <FileCode className="w-6 h-6 text-[var(--cockpit-cyan)]" />
                )}
              </div>
              <div>
                <h1 className="text-3xl mb-2">
                  {review.source === 'github' && review.repo_full_name 
                    ? `${review.repo_full_name} #${review.pull_request_number}`
                    : 'Manual Diff Review'}
                </h1>
                <div className="flex items-center gap-3">
                  <StatusPill status={review.status} />
                  <Badge variant="secondary">{review.source}</Badge>
                  <span className="text-sm text-muted-foreground">ID: {review.id}</span>
                </div>
              </div>
            </div>
            {review.source === 'github' && review.repo_full_name && (
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={`https://github.com/${review.repo_full_name}/pull/${review.pull_request_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 bg-[var(--cockpit-cyan)]/10 border-[var(--cockpit-cyan)]/30">
              <div className="text-2xl text-[var(--cockpit-cyan)] mb-1">
                {review.review_metadata.total_comments}
              </div>
              <div className="text-sm text-muted-foreground">Total Comments</div>
            </Card>
            <Card className="p-4 bg-[var(--cockpit-red)]/10 border-[var(--cockpit-red)]/30">
              <div className="text-2xl text-[var(--cockpit-red)] mb-1">
                {review.review_metadata.severity_counts.critical || 0}
              </div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </Card>
            <Card className="p-4 bg-[var(--cockpit-red)]/10 border-[var(--cockpit-red)]/30">
              <div className="text-2xl text-[var(--cockpit-red)] mb-1">
                {review.review_metadata.severity_counts.error || 0}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </Card>
            <Card className="p-4 bg-[var(--cockpit-yellow)]/10 border-[var(--cockpit-yellow)]/30">
              <div className="text-2xl text-[var(--cockpit-yellow)] mb-1">
                {review.review_metadata.severity_counts.warning || 0}
              </div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </Card>
            <Card className="p-4 bg-[var(--cockpit-green)]/10 border-[var(--cockpit-green)]/30">
              <div className="text-2xl text-[var(--cockpit-green)] mb-1">
                {review.review_metadata.execution_time_seconds?.toFixed(1) || 'N/A'}s
              </div>
              <div className="text-sm text-muted-foreground">Execution Time</div>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">File</label>
              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="w-full p-2 rounded-lg bg-input border border-border text-sm"
              >
                <option value="all">All Files</option>
                {files.map(file => (
                  <option key={file} value={file}>{file}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Severity</label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full p-2 rounded-lg bg-input border border-border text-sm"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 rounded-lg bg-input border border-border text-sm"
              >
                <option value="all">All Categories</option>
                {Object.keys(review.review_metadata.category_counts).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full p-2 rounded-lg bg-input border border-border text-sm"
              >
                <option value="all">All Agents</option>
                {review.review_metadata.agents_used.map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Comments */}
        <Tabs defaultValue="grouped" className="space-y-6">
          <TabsList>
            <TabsTrigger value="grouped">Grouped by File</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="grouped" className="space-y-6">
            {files.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No comments available</p>
              </Card>
            ) : (
              files.map(file => {
                const fileComments = filteredComments.filter(c => c.file_path === file);
                if (fileComments.length === 0 && selectedFile === 'all') return null;
                
                return (
                  <div key={file}>
                    <div className="flex items-center gap-3 mb-4">
                      <FileCode className="w-5 h-5 text-[var(--cockpit-cyan)]" />
                      <h3 className="font-mono text-sm">{file}</h3>
                      <Badge variant="outline">{fileComments.length}</Badge>
                    </div>
                    <div className="space-y-3 ml-8">
                      {fileComments.map((comment, i) => (
                        <CommentItem key={i} comment={comment} />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-3">
            {filteredComments.map((comment, i) => (
              <CommentItem key={i} comment={comment} />
            ))}
          </TabsContent>

          <TabsContent value="metadata">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[var(--cockpit-cyan)]" />
                  Timeline
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(review.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated</span>
                    <span>{new Date(review.updated_at).toLocaleString()}</span>
                  </div>
                  {review.review_metadata.execution_time_seconds && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Execution Time</span>
                      <span>{review.review_metadata.execution_time_seconds.toFixed(2)}s</span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[var(--cockpit-purple)]" />
                  Agents
                </h3>
                <div className="flex flex-wrap gap-2">
                  {review.review_metadata.agents_used.map(agent => (
                    <Badge key={agent} variant="secondary">{agent}</Badge>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Mock data
const mockReview: ReviewRequest = {
  id: 'rev_demo123',
  source: 'manual',
  status: 'completed',
  comments: [
    {
      line_start: 10,
      line_end: 12,
      file_path: 'src/auth/login.ts',
      comment: 'Potential SQL injection vulnerability detected. User input is not properly sanitized before database query.',
      severity: 'critical',
      category: 'security',
      agent: 'security-agent',
      suggested_fix: 'Use parameterized queries or an ORM to prevent SQL injection:\n\nconst result = await db.query(\n  \'SELECT * FROM users WHERE email = $1\',\n  [email]\n);'
    },
    {
      line_start: 25,
      line_end: 25,
      file_path: 'src/auth/login.ts',
      comment: 'Consider adding error handling for this async operation.',
      severity: 'warning',
      category: 'best_practice',
      agent: 'best-practice-agent'
    }
  ],
  review_metadata: {
    total_comments: 2,
    severity_counts: { critical: 1, error: 0, warning: 1, info: 0 },
    category_counts: { security: 1, best_practice: 1, performance: 0, style: 0, bug: 0, documentation: 0, complexity: 0, maintainability: 0, testing: 0 },
    agents_used: ['security-agent', 'best-practice-agent'],
    execution_time_seconds: 8.5
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
