import React, { useState, useEffect } from 'react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  closesAt: number;
  onExpired?: () => void;
}

export default function CountdownTimer({ closesAt, onExpired }: CountdownTimerProps) {
  const [timeText, setTimeText] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = closesAt - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeText('Closed');
        onExpired?.();
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      // Format as simple text
      if (hours > 0) {
        setTimeText(`${hours}h ${minutes}m left`);
      } else if (minutes > 0) {
        setTimeText(`${minutes}m ${seconds}s left`);
      } else {
        setTimeText(`${seconds}s left`);
      }

      setIsUrgent(diff < 3600000); // Less than 1 hour
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [closesAt, onExpired]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 transition-all duration-500',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Pulsing dot */}
      {!isExpired && (
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            backgroundColor: isUrgent ? Colors.dark.error : Colors.dark.accent,
          }}
        />
      )}

      <span
        className="text-sm font-medium"
        style={{
          color: isExpired
            ? Colors.dark.textMuted
            : isUrgent
            ? Colors.dark.error
            : Colors.dark.textSecondary,
        }}
      >
        {timeText}
      </span>
    </div>
  );
}
