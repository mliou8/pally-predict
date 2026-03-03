import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthConfig = {
  sm: 'max-w-xl',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl',
};

export default function PageContainer({
  children,
  className,
  maxWidth = 'xl',
}: PageContainerProps) {
  return (
    <div className={cn('min-h-screen bg-background pb-20 md:pb-6', className)}>
      <div className={cn(maxWidthConfig[maxWidth], 'mx-auto px-4 md:px-8 py-6 md:py-10')}>
        {children}
      </div>
    </div>
  );
}
