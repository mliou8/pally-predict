import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6', className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-muted mb-6">
          <Icon size={32} className="text-primary" />
        </div>
      )}
      <h2 className="text-2xl font-bold mb-2 text-center text-foreground">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-center mb-8 max-w-xs text-muted-foreground">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
