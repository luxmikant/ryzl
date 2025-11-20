import { ReviewComment, Severity } from '../../types';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { AlertCircle, AlertTriangle, Info, Skull } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CommentItemProps {
  comment: ReviewComment;
}

const severityConfig: Record<Severity, { icon: React.ReactNode; color: string; bgColor: string }> = {
  critical: {
    icon: <Skull className="w-4 h-4" />,
    color: 'text-[var(--cockpit-red)]',
    bgColor: 'bg-[var(--cockpit-red)]/10 border-[var(--cockpit-red)]/30'
  },
  error: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-[var(--cockpit-red)]',
    bgColor: 'bg-[var(--cockpit-red)]/10 border-[var(--cockpit-red)]/30'
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-[var(--cockpit-yellow)]',
    bgColor: 'bg-[var(--cockpit-yellow)]/10 border-[var(--cockpit-yellow)]/30'
  },
  info: {
    icon: <Info className="w-4 h-4" />,
    color: 'text-[var(--cockpit-cyan)]',
    bgColor: 'bg-[var(--cockpit-cyan)]/10 border-[var(--cockpit-cyan)]/30'
  }
};

export function CommentItem({ comment }: CommentItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = severityConfig[comment.severity];

  return (
    <Card className={`p-4 border ${config.bgColor}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center ${config.color}`}>
          {config.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={config.color}>
                {comment.severity}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {comment.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                by {comment.agent}
              </span>
            </div>
            <div className="text-xs text-muted-foreground font-mono flex-shrink-0">
              {comment.line_start === comment.line_end 
                ? `L${comment.line_start}` 
                : `L${comment.line_start}-${comment.line_end}`}
            </div>
          </div>

          <div className="text-sm text-foreground mb-2">
            {comment.comment}
          </div>

          <div className="text-xs text-muted-foreground mb-2">
            <span className="font-mono">{comment.file_path}</span>
          </div>

          {comment.suggested_fix && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-xs text-[var(--cockpit-cyan)] hover:text-[var(--cockpit-cyan)]/80 transition-colors">
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                Suggested Fix
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="p-3 rounded-lg bg-background/50 border border-border">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-[var(--cockpit-green)]">
                    {comment.suggested_fix}
                  </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </Card>
  );
}
