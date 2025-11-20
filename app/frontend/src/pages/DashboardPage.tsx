import { useState, useEffect } from 'react';
import { ReviewRequest } from '../types';
import { ReviewCard } from '../components/dashboard/ReviewCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { apiClient } from '../api/client';
import { toast } from 'sonner';

export function DashboardPage() {
  const [reviews, setReviews] = useState<ReviewRequest[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [reviews, searchQuery, statusFilter, sourceFilter]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await apiClient.listReviews();
      setReviews(data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast.error('Failed to load reviews');
      // Use mock data for demonstration
      setReviews(mockReviews);
    } finally {
      setLoading(false);
    }
  };

  const filterReviews = () => {
    let filtered = reviews;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(r => r.source === sourceFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.repo_full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredReviews(filtered);
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl mb-2">Mission Control</h1>
              <p className="text-muted-foreground">Monitor and manage all your code reviews</p>
            </div>
            <Button onClick={loadReviews} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total', value: reviews.length, color: 'bg-[var(--cockpit-cyan)]/20 text-[var(--cockpit-cyan)]' },
              { label: 'Running', value: reviews.filter(r => r.status === 'running').length, color: 'bg-[var(--cockpit-purple)]/20 text-[var(--cockpit-purple)]' },
              { label: 'Completed', value: reviews.filter(r => r.status === 'completed').length, color: 'bg-[var(--cockpit-green)]/20 text-[var(--cockpit-green)]' },
              { label: 'Failed', value: reviews.filter(r => r.status === 'failed').length, color: 'bg-[var(--cockpit-red)]/20 text-[var(--cockpit-red)]' },
            ].map((stat, i) => (
              <div key={i} className={`p-4 rounded-xl ${stat.color} border border-current/30`}>
                <div className="text-2xl mb-1">{stat.value}</div>
                <div className="text-sm opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID or repo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'running', 'completed', 'failed'].map(status => (
                  <Badge
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                {['all', 'manual', 'github'].map(source => (
                  <Badge
                    key={source}
                    variant={sourceFilter === source ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSourceFilter(source)}
                  >
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-[var(--cockpit-cyan)] mx-auto mb-4" />
            <p className="text-muted-foreground">Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground mb-4">No reviews found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or create a new review</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredReviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Mock data for demonstration
const mockReviews: ReviewRequest[] = [
  {
    id: 'rev_abc123',
    source: 'github',
    status: 'completed',
    repo_full_name: 'acme/api-service',
    pull_request_number: 42,
    comments: [],
    review_metadata: {
      total_comments: 8,
      severity_counts: { critical: 2, error: 1, warning: 3, info: 2 },
      category_counts: { security: 2, performance: 1, style: 3, best_practice: 2, bug: 0, documentation: 0, complexity: 0, maintainability: 0, testing: 0 },
      agents_used: ['security', 'performance', 'style'],
      execution_time_seconds: 12.5
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'rev_def456',
    source: 'manual',
    status: 'running',
    comments: [],
    review_metadata: {
      total_comments: 0,
      severity_counts: { critical: 0, error: 0, warning: 0, info: 0 },
      category_counts: { security: 0, performance: 0, style: 0, best_practice: 0, bug: 0, documentation: 0, complexity: 0, maintainability: 0, testing: 0 },
      agents_used: []
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
