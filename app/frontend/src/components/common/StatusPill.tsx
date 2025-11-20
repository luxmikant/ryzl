import { ReviewStatus } from '../../types';
import { Clock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface StatusPillProps {
  status: ReviewStatus;
  className?: string;
}

const statusConfig: Record<ReviewStatus, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  pending: {
    icon: <Clock className="w-4 h-4" />,
    color: 'text-[var(--cockpit-yellow)]',
    bgColor: 'bg-[var(--cockpit-yellow)]/20',
    label: 'Pending'
  },
  running: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: 'text-[var(--cockpit-cyan)]',
    bgColor: 'bg-[var(--cockpit-cyan)]/20',
    label: 'Running'
  },
  completed: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-[var(--cockpit-green)]',
    bgColor: 'bg-[var(--cockpit-green)]/20',
    label: 'Completed'
  },
  failed: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-[var(--cockpit-red)]',
    bgColor: 'bg-[var(--cockpit-red)]/20',
    label: 'Failed'
  }
};

export function StatusPill({ status, className = '' }: StatusPillProps) {
  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${config.color} ${className}`}>
      {config.icon}
      <span className="text-sm">{config.label}</span>
    </div>
  );
}
