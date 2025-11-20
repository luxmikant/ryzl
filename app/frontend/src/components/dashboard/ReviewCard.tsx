import { Link } from 'react-router-dom';
import { Clock, GitPullRequest, FileCode, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { ReviewRequest, ReviewStatus } from '../../types';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';

interface ReviewCardProps {
  review: ReviewRequest;
}

const statusConfig: Record<ReviewStatus, { icon: React.ReactNode; color: string; label: string }> = {
  pending: {
    icon: <Clock className="w-4 h-4" />,
    color: 'text-[var(--cockpit-yellow)]',
    label: 'Pending'
  },
  running: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: 'text-[var(--cockpit-cyan)]',
    label: 'Running'
  },
  completed: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-[var(--cockpit-green)]',
    label: 'Completed'
  },
  failed: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-[var(--cockpit-red)]',
    label: 'Failed'
  }
};

export function ReviewCard({ review }: ReviewCardProps) {
  const status = statusConfig[review.status];
  const isGithub = review.source === 'github';

  return (
    <Link to={`/review/${review.id}`}>
      <Card className="p-6 hover:border-[var(--cockpit-cyan)]/50 transition-all duration-300 group cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isGithub ? 'bg-[var(--cockpit-purple)]/20' : 'bg-[var(--cockpit-cyan)]/20'
            }`}>
              {isGithub ? (
                <GitPullRequest className={`w-5 h-5 ${isGithub ? 'text-[var(--cockpit-purple)]' : 'text-[var(--cockpit-cyan)]'}`} />
              ) : (
                <FileCode className="w-5 h-5 text-[var(--cockpit-cyan)]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={status.color}>
                  {status.icon}
                  <span className="ml-1">{status.label}</span>
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {review.source}
                </Badge>
              </div>
              {isGithub && review.repo_full_name && (
                <div className="text-sm text-muted-foreground">
                  {review.repo_full_name} #{review.pull_request_number}
                </div>
              )}
              {!isGithub && (
                <div className="text-sm text-muted-foreground">
                  Manual diff review
                </div>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString()}
          </div>
        </div>

        {review.status === 'completed' && (
          <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-accent/50 border border-border">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Comments</div>
              <div className="font-mono">{review.review_metadata.total_comments}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Critical</div>
              <div className="font-mono text-[var(--cockpit-red)]">
                {review.review_metadata.severity_counts.critical || 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Warnings</div>
              <div className="font-mono text-[var(--cockpit-yellow)]">
                {review.review_metadata.severity_counts.warning || 0}
              </div>
            </div>
          </div>
        )}

        {review.status === 'failed' && review.error_message && (
          <div className="p-3 rounded-lg bg-[var(--cockpit-red)]/10 border border-[var(--cockpit-red)]/30">
            <div className="text-xs text-[var(--cockpit-red)] line-clamp-2">
              {review.error_message}
            </div>
          </div>
        )}

        {review.status === 'running' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--cockpit-cyan)]" />
            <span>Pipeline processing...</span>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>ID: {review.id.slice(0, 8)}</span>
          </div>
          <div className="text-xs text-[var(--cockpit-cyan)] opacity-0 group-hover:opacity-100 transition-opacity">
            View Details →
          </div>
        </div>
      </Card>
    </Link>
  );
}
