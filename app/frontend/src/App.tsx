import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewDetailPage } from './pages/ReviewDetailPage';
import { ManualSubmitPage } from './pages/ManualSubmitPage';
import { GitHubSubmitPage } from './pages/GitHubSubmitPage';
import { SettingsPage } from './pages/SettingsPage';
import { MetricsPage } from './pages/MetricsPage';
import './styles/globals.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="dark">
        <Routes>
          {/* Home page without AppShell */}
          <Route path="/" element={<HomePage />} />

          {/* All other routes wrapped in AppShell */}
          <Route
            path="/*"
            element={
              <AppShell>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/review/:id" element={<ReviewDetailPage />} />
                  <Route path="/submit/manual" element={<ManualSubmitPage />} />
                  <Route path="/submit/github" element={<GitHubSubmitPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/metrics" element={<MetricsPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AppShell>
            }
          />
        </Routes>

        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)'
            }
          }}
        />
      </div>
    </BrowserRouter>
  );
}
