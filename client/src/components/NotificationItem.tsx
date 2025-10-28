import { Bell, TrendingUp, Award } from 'lucide-react';

interface NotificationItemProps {
  type: 'new_prompt' | 'results' | 'rank_change';
  title: string;
  body: string;
  timestamp: string;
}

export default function NotificationItem({ type, title, body, timestamp }: NotificationItemProps) {
  const icons = {
    new_prompt: Bell,
    results: TrendingUp,
    rank_change: Award
  };

  const Icon = icons[type];

  return (
    <div className="flex gap-3 p-4 rounded-xl hover-elevate border border-border" data-testid="notification-item">
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Icon className="text-primary" size={20} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground mb-2">{body}</p>
        <p className="text-xs text-muted-foreground">{timestamp}</p>
      </div>
    </div>
  );
}
