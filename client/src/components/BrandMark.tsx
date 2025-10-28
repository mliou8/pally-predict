interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function BrandMark({ size = 'md', animated = true }: BrandMarkProps) {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  };

  return (
    <div className={`font-display font-bold ${sizes[size]} bg-gradient-to-r from-primary to-brand-magenta bg-clip-text text-transparent ${animated ? 'animate-pulse' : ''}`} data-testid="brand-logo">
      PALLY <span className="text-gold">α</span>
    </div>
  );
}
