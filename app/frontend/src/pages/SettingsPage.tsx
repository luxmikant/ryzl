import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Settings, 
  Cpu, 
  Github, 
  Key, 
  Database,
  Activity,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { PipelineConfig } from '../types';
import { apiClient } from '../api/client';
import { toast } from 'sonner';
import { Switch } from '../components/ui/switch';

export function SettingsPage() {
  const [config, setConfig] = useState<PipelineConfig | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
    const existingKey = apiClient.getApiKey();
    if (existingKey) {
      setApiKey(existingKey);
    }
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getConfig();
      setConfig(data);
    } catch (error) {
      console.error('Failed to load config:', error);
      toast.error('Using default configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error('API key cannot be empty');
      return;
    }
    apiClient.setApiKey(apiKey.trim());
    toast.success('API key saved successfully');
  };

  const handleClearApiKey = () => {
    apiClient.clearApiKey();
    setApiKey('');
    toast.success('API key cleared');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Activity className="w-8 h-8 animate-spin text-[var(--cockpit-cyan)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--cockpit-cyan)] to-[var(--cockpit-purple)] flex items-center justify-center">
              <Settings className="w-6 h-6 text-background" />
            </div>
            <div>
              <h1 className="text-3xl mb-1">System Configuration</h1>
              <p className="text-muted-foreground">Review and manage pipeline settings</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Key Configuration */}
          <Card className="p-6 border-[var(--cockpit-cyan)]/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--cockpit-cyan)]/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-[var(--cockpit-cyan)]" />
              </div>
              <div>
                <h3>API Key</h3>
                <p className="text-sm text-muted-foreground">Required for creating reviews</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="pr-10"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveApiKey} className="flex-1 bg-[var(--cockpit-cyan)] hover:bg-[var(--cockpit-cyan)]/80">
                  <Save className="w-4 h-4 mr-2" />
                  Save API Key
                </Button>
                <Button onClick={handleClearApiKey} variant="outline">
                  Clear
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-[var(--cockpit-yellow)]/10 border border-[var(--cockpit-yellow)]/30">
                <p className="text-xs text-[var(--cockpit-yellow)]">
                  ⚠️ API keys are stored locally in your browser. This tool is intended for internal/admin use only.
                </p>
              </div>
            </div>
          </Card>

          {/* Pipeline Configuration */}
          {config && (
            <Card className="p-6 border-[var(--cockpit-purple)]/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--cockpit-purple)]/20 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-[var(--cockpit-purple)]" />
                </div>
                <div>
                  <h3>Pipeline Mode</h3>
                  <p className="text-sm text-muted-foreground">Agent execution strategy</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border">
                  <span className="text-sm text-muted-foreground">Mode</span>
                  <Badge variant="secondary" className="text-[var(--cockpit-purple)]">
                    {config.pipeline_mode}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {config.pipeline_mode === 'parallel' 
                    ? 'Agents run concurrently for faster analysis'
                    : 'Agents run sequentially for controlled execution'}
                </p>
              </div>
            </Card>
          )}

          {/* LLM Configuration */}
          {config && (
            <Card className="p-6 border-[var(--cockpit-green)]/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--cockpit-green)]/20 flex items-center justify-center">
                  <Database className="w-5 h-5 text-[var(--cockpit-green)]" />
                </div>
                <div>
                  <h3>LLM Configuration</h3>
                  <p className="text-sm text-muted-foreground">Model and provider settings</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border">
                  <span className="text-sm text-muted-foreground">Provider</span>
                  <Badge variant="secondary">{config.llm_provider}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border">
                  <span className="text-sm text-muted-foreground">Model</span>
                  <Badge variant="secondary">{config.llm_model}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border">
                  <span className="text-sm text-muted-foreground">Deterministic</span>
                  <Switch checked={config.llm_deterministic} disabled />
                </div>
              </div>
            </Card>
          )}

          {/* GitHub Integration */}
          {config && (
            <Card className="p-6 border-[var(--cockpit-yellow)]/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--cockpit-yellow)]/20 flex items-center justify-center">
                  <Github className="w-5 h-5 text-[var(--cockpit-yellow)]" />
                </div>
                <div>
                  <h3>GitHub Integration</h3>
                  <p className="text-sm text-muted-foreground">PR comment synchronization</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border">
                  <span className="text-sm text-muted-foreground">Comment Sync</span>
                  <Switch checked={config.github_comment_sync_enabled} disabled />
                </div>
                <p className="text-xs text-muted-foreground">
                  When enabled, review comments are automatically posted to GitHub PRs
                </p>
              </div>
            </Card>
          )}

          {/* System Limits */}
          {config && (
            <Card className="p-6 border-[var(--cockpit-red)]/30 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--cockpit-red)]/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[var(--cockpit-red)]" />
                </div>
                <div>
                  <h3>System Limits & Monitoring</h3>
                  <p className="text-sm text-muted-foreground">Resource constraints and observability</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-accent/50 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Max Diff Size</div>
                  <div className="font-mono text-lg">{(config.max_diff_size_bytes / 1024 / 1024).toFixed(1)} MB</div>
                </div>
                <div className="p-3 rounded-lg bg-accent/50 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Prometheus Metrics</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${config.enable_prometheus_metrics ? 'bg-[var(--cockpit-green)]' : 'bg-[var(--cockpit-red)]'}`} />
                    <span className="text-sm">{config.enable_prometheus_metrics ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-accent/50 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Pipeline Mode</div>
                  <div className="text-sm capitalize">{config.pipeline_mode}</div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Info Banner */}
        <Card className="p-6 mt-6 border-[var(--cockpit-cyan)]/30 bg-[var(--cockpit-cyan)]/5">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-[var(--cockpit-cyan)] flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p>
                These settings are read-only and configured on the backend. To modify them, update your environment variables or configuration file.
              </p>
              <p className="text-muted-foreground">
                API keys stored here are for client-side authentication only and remain in your browser's local storage.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
