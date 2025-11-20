// API Types matching backend schemas

export type ReviewSource = 'manual' | 'github';
export type ReviewStatus = 'pending' | 'running' | 'completed' | 'failed';
export type Severity = 'info' | 'warning' | 'error' | 'critical';
export type Category = 
  | 'security' 
  | 'performance' 
  | 'style' 
  | 'best_practice' 
  | 'bug' 
  | 'documentation'
  | 'complexity'
  | 'maintainability'
  | 'testing';

export interface ReviewComment {
  line_start: number;
  line_end: number;
  file_path: string;
  comment: string;
  severity: Severity;
  category: Category;
  agent: string;
  suggested_fix?: string;
}

export interface ReviewMetadata {
  total_comments: number;
  severity_counts: Record<Severity, number>;
  category_counts: Record<Category, number>;
  agents_used: string[];
  execution_time_seconds?: number;
}

export interface ReviewRequest {
  id: string;
  source: ReviewSource;
  status: ReviewStatus;
  repo_full_name?: string;
  pull_request_number?: number;
  diff?: string;
  comments: ReviewComment[];
  review_metadata: ReviewMetadata;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

export interface CreateReviewPayload {
  source: ReviewSource;
  diff?: string;
  repo_full_name?: string;
  pull_request_number?: number;
}

export interface PipelineConfig {
  pipeline_mode: string;
  llm_provider: string;
  llm_model: string;
  llm_deterministic: boolean;
  github_comment_sync_enabled: boolean;
  max_diff_size_bytes: number;
  enable_prometheus_metrics: boolean;
}

export interface MetricsData {
  llm_requests_total: number;
  llm_errors_total: number;
  llm_latency_p95: number;
  llm_tokens_total: number;
  reviews_total: number;
  reviews_by_status: Record<ReviewStatus, number>;
}
