import React, { useState, useEffect, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';
import Colors from '@/constants/colors';
import { WAGER_PRESETS } from '@/types/game';
import { cn } from '@/lib/utils';

interface WagerSelectorProps {
  wagerAmount: number;
  maxPoints: number;
  isLocked: boolean;
  onWagerChange: (amount: number) => void;
}

export default function WagerSelector({
  wagerAmount,
  maxPoints,
  isLocked,
  onWagerChange,
}: WagerSelectorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handlePreset = useCallback(
    (amount: number) => {
      if (isLocked) return;
      const clamped = Math.min(amount, maxPoints);
      onWagerChange(clamped);
    },
    [isLocked, maxPoints, onWagerChange]
  );

  const handleIncrement = useCallback(
    (delta: number) => {
      if (isLocked) return;
      const next = Math.max(10, Math.min(wagerAmount + delta, maxPoints));
      onWagerChange(next);
    },
    [isLocked, wagerAmount, maxPoints, onWagerChange]
  );

  const handleAllIn = useCallback(() => {
    if (isLocked) return;
    onWagerChange(maxPoints);
  }, [isLocked, maxPoints, onWagerChange]);

  const wagerPct = maxPoints > 0 ? (wagerAmount / maxPoints) * 100 : 0;

  return (
    <div
      className={cn(
        'mb-4 transition-all duration-300',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      {/* Amount Row */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => handleIncrement(-50)}
          disabled={isLocked || wagerAmount <= 10}
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
            'active:scale-95',
            (isLocked || wagerAmount <= 10) && 'opacity-30'
          )}
          style={{ backgroundColor: Colors.dark.surface }}
        >
          <Minus
            size={20}
            color={Colors.dark.text}
            strokeWidth={2}
          />
        </button>

        <div className="flex flex-col items-center">
          <span
            className="text-5xl font-black tabular-nums"
            style={{
              color: Colors.dark.text,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {wagerAmount}
          </span>
          <span
            className="text-xs font-semibold -mt-1"
            style={{ color: Colors.dark.accent }}
          >
            WP
          </span>
        </div>

        <button
          onClick={() => handleIncrement(50)}
          disabled={isLocked || wagerAmount >= maxPoints}
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
            'active:scale-95',
            (isLocked || wagerAmount >= maxPoints) && 'opacity-30'
          )}
          style={{ backgroundColor: Colors.dark.surface }}
        >
          <Plus
            size={20}
            color={Colors.dark.text}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 rounded-full mb-4 overflow-hidden"
        style={{ backgroundColor: Colors.dark.surface }}
      >
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{
            width: `${Math.min(wagerPct, 100)}%`,
            backgroundColor: Colors.dark.accent,
          }}
        />
      </div>

      {/* Presets */}
      <div className="flex gap-2">
        {WAGER_PRESETS.filter((p) => p <= maxPoints).map((preset) => {
          const isActive = wagerAmount === preset;
          return (
            <button
              key={preset}
              onClick={() => handlePreset(preset)}
              disabled={isLocked}
              className={cn(
                'flex-1 py-3 rounded-lg transition-all',
                'active:scale-95',
                isLocked && 'opacity-30'
              )}
              style={{
                backgroundColor: isActive ? Colors.dark.accent : Colors.dark.surface,
              }}
            >
              <span
                className="text-sm font-bold tabular-nums"
                style={{
                  color: isActive ? '#000' : Colors.dark.textSecondary,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {preset}
              </span>
            </button>
          );
        })}

        <button
          onClick={handleAllIn}
          disabled={isLocked}
          className={cn(
            'flex-1 py-3 rounded-lg transition-all',
            'active:scale-95',
            isLocked && 'opacity-30'
          )}
          style={{
            backgroundColor: wagerAmount === maxPoints ? Colors.dark.error : Colors.dark.surface,
          }}
        >
          <span
            className="text-xs font-bold"
            style={{
              color: wagerAmount === maxPoints ? '#fff' : Colors.dark.error,
            }}
          >
            MAX
          </span>
        </button>
      </div>
    </div>
  );
}
