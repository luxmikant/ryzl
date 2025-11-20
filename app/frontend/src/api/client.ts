import { ReviewRequest, CreateReviewPayload, PipelineConfig, MetricsData } from '../types';

// Safely access environment variable with fallback
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) 
  ? import.meta.env.VITE_API_BASE_URL 
  : 'http://localhost:8000';

class ApiClient {
  private apiKey: string | null = null;

  constructor() {
    // Load API key from localStorage if available
    this.apiKey = localStorage.getItem('SERVICE_API_KEY');
  }

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('SERVICE_API_KEY', key);
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  clearApiKey() {
    this.apiKey = null;
    localStorage.removeItem('SERVICE_API_KEY');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async createReview(payload: CreateReviewPayload): Promise<ReviewRequest> {
    return this.request<ReviewRequest>('/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getReview(id: string): Promise<ReviewRequest> {
    return this.request<ReviewRequest>(`/api/v1/reviews/${id}`);
  }

  async listReviews(): Promise<ReviewRequest[]> {
    // Mock implementation for now - backend may not have this endpoint yet
    try {
      return await this.request<ReviewRequest[]>('/api/v1/reviews');
    } catch {
      // Return empty array if endpoint doesn't exist
      return [];
    }
  }

  async getConfig(): Promise<PipelineConfig> {
    // Mock implementation - backend may not have this endpoint yet
    try {
      return await this.request<PipelineConfig>('/api/v1/config');
    } catch {
      // Return mock config
      return {
        pipeline_mode: 'parallel',
        llm_provider: 'openai',
        llm_model: 'gpt-4',
        llm_deterministic: false,
        github_comment_sync_enabled: true,
        max_diff_size_bytes: 1048576,
        enable_prometheus_metrics: true,
      };
    }
  }

  async getMetrics(): Promise<MetricsData> {
    // Mock implementation - would need to parse Prometheus metrics
    try {
      const response = await fetch(`${API_BASE_URL}/metrics`);
      const text = await response.text();
      
      // Basic parsing of Prometheus format (simplified)
      return this.parsePrometheusMetrics(text);
    } catch {
      return {
        llm_requests_total: 0,
        llm_errors_total: 0,
        llm_latency_p95: 0,
        llm_tokens_total: 0,
        reviews_total: 0,
        reviews_by_status: {
          pending: 0,
          running: 0,
          completed: 0,
          failed: 0,
        },
      };
    }
  }

  private parsePrometheusMetrics(text: string): MetricsData {
    // Simple parsing - in production, use a proper Prometheus parser
    const lines = text.split('\n');
    const metrics: MetricsData = {
      llm_requests_total: 0,
      llm_errors_total: 0,
      llm_latency_p95: 0,
      llm_tokens_total: 0,
      reviews_total: 0,
      reviews_by_status: {
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
      },
    };

    lines.forEach(line => {
      if (line.startsWith('llm_requests_total')) {
        const match = line.match(/llm_requests_total\s+([\d.]+)/);
        if (match) metrics.llm_requests_total = parseFloat(match[1]);
      }
      // Add more parsing as needed
    });

    return metrics;
  }

  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        return { status: 'healthy' };
      }
      return { status: 'unhealthy' };
    } catch {
      return { status: 'unreachable' };
    }
  }
}

export const apiClient = new ApiClient();