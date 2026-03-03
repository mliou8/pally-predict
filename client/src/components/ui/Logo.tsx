import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { box: 'w-8 h-8', text: 'text-sm', label: 'text-sm' },
  md: { box: 'w-10 h-10', text: 'text-lg', label: 'text-base' },
  lg: { box: 'w-16 h-16', text: 'text-3xl', label: 'text-xl' },
};

export default function Logo({ size = 'md', showText = false, className }: LogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          config.box,
          'rounded-lg flex items-center justify-center bg-primary'
        )}
      >
        <span className={cn(config.text, 'font-black text-primary-foreground')}>P</span>
      </div>
      {showText && (
        <div className={cn(config.label, 'font-bold text-foreground')}>
          PALLY
        </div>
      )}
    </div>
  );
}
