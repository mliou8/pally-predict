import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import Colors from '@/constants/colors';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  closesAt: number;
  onExpired?: () => void;
}

export default function CountdownTimer({ closesAt, onExpired }: CountdownTimerProps) {
  const [hours, setHours] = useState<string>('00');
  const [minutes, setMinutes] = useState<string>('00');
  const [seconds, setSeconds] = useState<string>('00');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pulseOn, setPulseOn] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 250);
    return () => clearTimeout(timer);
  }, []);

  // Pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseOn((prev) => !prev);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = closesAt - now;

      if (diff <= 0) {
        setIsExpired(true);
        setHours('00');
        setMinutes('00');
        setSeconds('00');
        onExpired?.();
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setHours(h.toString().padStart(2, '0'));
      setMinutes(m.toString().padStart(2, '0'));
      setSeconds(s.toString().padStart(2, '0'));
      setIsUrgent(diff < 3600000);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [closesAt, onExpired]);

  const accentColor = isExpired ? Colors.dark.textMuted : isUrgent ? Colors.dark.error : Colors.dark.accent;

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3.5 rounded-[14px] border transition-opacity duration-500',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        backgroundColor: Colors.dark.surface,
        borderColor: Colors.dark.border,
      }}
    >
      <div className="flex items-center gap-[7px]">
        <div
          className="w-1.5 h-1.5 rounded-full transition-opacity duration-300"
          style={{
            backgroundColor: accentColor,
            opacity: pulseOn ? 1 : 0.3,
          }}
        />
        <Clock size={13} color={accentColor} strokeWidth={2} />
        <span
          className="text-[11px] font-extrabold tracking-[1.5px]"
          style={{ color: accentColor }}
        >
          {isExpired ? 'CLOSED' : 'LIVE'}
        </span>
      </div>

      <div className="flex items-baseline gap-0.5">
        <div className="flex items-baseline">
          <span
            className="text-xl font-bold tracking-wide tabular-nums"
            style={{ color: isExpired ? Colors.dark.textMuted : Colors.dark.text }}
          >
            {hours}
          </span>
          <span className="text-[10px] font-semibold ml-0.5" style={{ color: Colors.dark.textMuted }}>
            h
          </span>
        </div>
        <span
          className="text-base font-semibold mx-0.5 mb-0.5"
          style={{ color: isExpired ? Colors.dark.textMuted : Colors.dark.textSecondary }}
        >
          :
        </span>
        <div className="flex items-baseline">
          <span
            className="text-xl font-bold tracking-wide tabular-nums"
            style={{ color: isExpired ? Colors.dark.textMuted : Colors.dark.text }}
          >
            {minutes}
          </span>
          <span className="text-[10px] font-semibold ml-0.5" style={{ color: Colors.dark.textMuted }}>
            m
          </span>
        </div>
        <span
          className="text-base font-semibold mx-0.5 mb-0.5"
          style={{ color: isExpired ? Colors.dark.textMuted : Colors.dark.textSecondary }}
        >
          :
        </span>
        <div className="flex items-baseline">
          <span
            className="text-xl font-bold tracking-wide tabular-nums"
            style={{
              color: isExpired ? Colors.dark.textMuted : isUrgent ? Colors.dark.error : Colors.dark.text,
            }}
          >
            {seconds}
          </span>
          <span className="text-[10px] font-semibold ml-0.5" style={{ color: Colors.dark.textMuted }}>
            s
          </span>
        </div>
      </div>
    </div>
  );
}
