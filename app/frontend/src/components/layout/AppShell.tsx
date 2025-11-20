import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  LayoutDashboard, 
  Upload, 
  GitPullRequest, 
  Settings, 
  Activity,
  Menu,
  X,
  Zap
} from 'lucide-react';
import { Button } from '../ui/button';

interface NavItem {
  icon: ReactNode;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: <Home className="w-5 h-5" />, label: 'Home', path: '/' },
  { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
  { icon: <Upload className="w-5 h-5" />, label: 'Manual Review', path: '/submit/manual' },
  { icon: <GitPullRequest className="w-5 h-5" />, label: 'GitHub PR', path: '/submit/github' },
  { icon: <Activity className="w-5 h-5" />, label: 'Metrics', path: '/metrics' },
  { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/settings' },
];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background dark">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--cockpit-cyan)] to-[var(--cockpit-purple)] flex items-center justify-center">
              <Zap className="w-6 h-6 text-background" />
            </div>
            <div>
              <h1 className="text-lg text-foreground tracking-tight">Code Review</h1>
              <p className="text-xs text-muted-foreground">Cockpit</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-lg shadow-[var(--cockpit-cyan-glow)]'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <span className={isActive ? 'text-[var(--cockpit-cyan)]' : ''}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--cockpit-green)] animate-pulse" />
              <span>System Online</span>
            </div>
            <div>Pipeline: Operational</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar - Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--cockpit-cyan)] to-[var(--cockpit-purple)] flex items-center justify-center">
              <Zap className="w-5 h-5 text-background" />
            </div>
            <h1 className="text-lg">Code Review Cockpit</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-card border-b border-border p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-accent/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
