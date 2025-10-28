import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownProps {
  to: string;
  size?: 'sm' | 'md';
  onComplete?: () => void;
}

export default function Countdown({ to, size = 'md', onComplete }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetTime = new Date(to).getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        onComplete?.();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );

      setIsUrgent(diff < 3600000);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [to, onComplete]);

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? 12 : 16;

  return (
    <div 
      className={`inline-flex items-center gap-1.5 ${textSize} font-mono ${isUrgent ? 'text-warning' : 'text-muted-foreground'}`}
      aria-live="polite"
      data-testid="countdown-timer"
    >
      <Clock className={`${isUrgent ? 'animate-pulse' : ''}`} size={iconSize} />
      <span>{timeLeft}</span>
    </div>
  );
}
