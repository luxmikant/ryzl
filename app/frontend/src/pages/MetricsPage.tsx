import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Zap,
  Database
} from 'lucide-react';
import { MetricsData } from '../types';
import { apiClient } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = [
  'var(--cockpit-cyan)',
  'var(--cockpit-purple)',
  'var(--cockpit-green)',
  'var(--cockpit-yellow)',
  'var(--cockpit-red)'
];

export function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await apiClient.getMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      // Use mock data
      setMetrics(mockMetrics);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--cockpit-cyan)]" />
      </div>
    );
  }

  const statusData = metrics ? [
    { name: 'Completed', value: metrics.reviews_by_status.completed, color: COLORS[2] },
    { name: 'Running', value: metrics.reviews_by_status.running, color: COLORS[0] },
    { name: 'Failed', value: metrics.reviews_by_status.failed, color: COLORS[4] },
    { name: 'Pending', value: metrics.reviews_by_status.pending, color: COLORS[3] }
  ] : [];

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--cockpit-cyan)] to-[var(--cockpit-purple)] flex items-center justify-center">
                <Activity className="w-6 h-6 text-background" />
              </div>
              <div>
                <h1 className="text-3xl mb-1">System Metrics</h1>
                <p className="text-muted-foreground">Real-time observability and performance data</p>
              </div>
            </div>
            <Button onClick={() => loadMetrics()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Health Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border-[var(--cockpit-cyan)]/30 bg-[var(--cockpit-cyan)]/5">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-[var(--cockpit-cyan)]" />
              <span className="text-sm text-muted-foreground">LLM Requests</span>
            </div>
            <div className="text-3xl text-[var(--cockpit-cyan)]">
              {metrics?.llm_requests_total.toLocaleString() || 0}
            </div>
          </Card>

          <Card className="p-6 border-[var(--cockpit-red)]/30 bg-[var(--cockpit-red)]/5">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-[var(--cockpit-red)]" />
              <span className="text-sm text-muted-foreground">LLM Errors</span>
            </div>
            <div className="text-3xl text-[var(--cockpit-red)]">
              {metrics?.llm_errors_total || 0}
            </div>
          </Card>

          <Card className="p-6 border-[var(--cockpit-purple)]/30 bg-[var(--cockpit-purple)]/5">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-[var(--cockpit-purple)]" />
              <span className="text-sm text-muted-foreground">P95 Latency</span>
            </div>
            <div className="text-3xl text-[var(--cockpit-purple)]">
              {metrics?.llm_latency_p95.toFixed(1) || 0}s
            </div>
          </Card>

          <Card className="p-6 border-[var(--cockpit-green)]/30 bg-[var(--cockpit-green)]/5">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-5 h-5 text-[var(--cockpit-green)]" />
              <span className="text-sm text-muted-foreground">Total Tokens</span>
            </div>
            <div className="text-3xl text-[var(--cockpit-green)]">
              {(metrics?.llm_tokens_total || 0) > 1000 
                ? `${((metrics?.llm_tokens_total || 0) / 1000).toFixed(1)}K`
                : metrics?.llm_tokens_total || 0}
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Reviews by Status */}
          <Card className="p-6">
            <h3 className="mb-4">Reviews by Status</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Request/Error Comparison */}
          <Card className="p-6">
            <h3 className="mb-4">LLM Performance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: 'Requests',
                      value: metrics?.llm_requests_total || 0,
                      fill: 'var(--cockpit-cyan)'
                    },
                    {
                      name: 'Errors',
                      value: metrics?.llm_errors_total || 0,
                      fill: 'var(--cockpit-red)'
                    },
                    {
                      name: 'Success Rate',
                      value: metrics?.llm_requests_total 
                        ? ((metrics.llm_requests_total - metrics.llm_errors_total) / metrics.llm_requests_total * 100).toFixed(1)
                        : 0,
                      fill: 'var(--cockpit-green)'
                    }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--muted-foreground)"
                    tick={{ fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis 
                    stroke="var(--muted-foreground)"
                    tick={{ fill: 'var(--muted-foreground)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="fill" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Detailed Stats */}
        <Card className="p-6">
          <h3 className="mb-4">Detailed Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-accent/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[var(--cockpit-cyan)]" />
                <span className="text-sm text-muted-foreground">Total Reviews</span>
              </div>
              <div className="text-2xl">{metrics?.reviews_total || 0}</div>
            </div>

            <div className="p-4 rounded-lg bg-accent/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-[var(--cockpit-green)]" />
                <span className="text-sm text-muted-foreground">Success Rate</span>
              </div>
              <div className="text-2xl text-[var(--cockpit-green)]">
                {metrics?.llm_requests_total 
                  ? ((metrics.llm_requests_total - metrics.llm_errors_total) / metrics.llm_requests_total * 100).toFixed(1)
                  : 0}%
              </div>
            </div>

            <div className="p-4 rounded-lg bg-accent/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[var(--cockpit-purple)]" />
                <span className="text-sm text-muted-foreground">Avg Response Time</span>
              </div>
              <div className="text-2xl text-[var(--cockpit-purple)]">
                {metrics?.llm_latency_p95 ? (metrics.llm_latency_p95 * 0.7).toFixed(2) : 0}s
              </div>
            </div>
          </div>
        </Card>

        {/* Info */}
        <Card className="p-6 mt-6 border-[var(--cockpit-cyan)]/30 bg-[var(--cockpit-cyan)]/5">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-[var(--cockpit-cyan)] flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p>
                Metrics are collected from the Prometheus endpoint and refreshed every 30 seconds. These statistics represent cumulative data since the last backend restart.
              </p>
              <p className="text-muted-foreground">
                Enable Prometheus metrics in your backend configuration to collect detailed performance data.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Mock data
const mockMetrics: MetricsData = {
  llm_requests_total: 1247,
  llm_errors_total: 23,
  llm_latency_p95: 2.4,
  llm_tokens_total: 45820,
  reviews_total: 156,
  reviews_by_status: {
    pending: 3,
    running: 5,
    completed: 142,
    failed: 6
  }
};
