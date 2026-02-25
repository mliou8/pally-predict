import React, { useState, useEffect, useCallback } from 'react';
import { Minus, Plus, Zap } from 'lucide-react';
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
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsPulsing(true);
    const timer = setTimeout(() => setIsPulsing(false), 150);
    return () => clearTimeout(timer);
  }, [wagerAmount]);

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
  const riskLevel = wagerPct > 60 ? 'HIGH' : wagerPct > 30 ? 'MED' : 'LOW';
  const riskColor = wagerPct > 60 ? Colors.dark.error : wagerPct > 30 ? Colors.dark.warning : Colors.dark.success;

  return (
    <div
      className={cn(
        'rounded-2xl p-4 border mb-4 transition-all duration-350',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
      style={{
        backgroundColor: Colors.dark.surface,
        borderColor: Colors.dark.border,
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3.5">
        <div className="flex items-center gap-1.5">
          <Zap size={12} color={Colors.dark.warning} />
          <span
            className="text-[11px] font-extrabold tracking-[1.8px]"
            style={{ color: Colors.dark.warning }}
          >
            WAGER
          </span>
        </div>
        <div
          className="flex items-center gap-[5px] px-2 py-[3px] rounded-md"
          style={{ backgroundColor: riskColor + '18' }}
        >
          <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: riskColor }} />
          <span className="text-[9px] font-extrabold tracking-[1px]" style={{ color: riskColor }}>
            {riskLevel} RISK
          </span>
        </div>
      </div>

      {/* Amount Row */}
      <div className="flex items-center justify-center gap-5 mb-3.5">
        <button
          onClick={() => handleIncrement(-50)}
          disabled={isLocked || wagerAmount <= 10}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center border transition-all',
            'hover:opacity-80 active:scale-95',
            (isLocked || wagerAmount <= 10) && 'opacity-35 cursor-not-allowed'
          )}
          style={{
            backgroundColor: Colors.dark.surfaceLight,
            borderColor: Colors.dark.border,
          }}
        >
          <Minus
            size={14}
            color={isLocked || wagerAmount <= 10 ? Colors.dark.textMuted : Colors.dark.text}
            strokeWidth={2.5}
          />
        </button>

        <div
          className={cn(
            'flex flex-col items-center min-w-[120px] transition-transform duration-150',
            isPulsing && 'scale-[1.04]'
          )}
        >
          <span
            className="text-4xl font-black tabular-nums tracking-tight"
            style={{ color: Colors.dark.text }}
          >
            {wagerAmount.toLocaleString()}
          </span>
          <span
            className="text-[10px] font-bold tracking-[2px] -mt-0.5"
            style={{ color: Colors.dark.textMuted }}
          >
            PTS
          </span>
        </div>

        <button
          onClick={() => handleIncrement(50)}
          disabled={isLocked || wagerAmount >= maxPoints}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center border transition-all',
            'hover:opacity-80 active:scale-95',
            (isLocked || wagerAmount >= maxPoints) && 'opacity-35 cursor-not-allowed'
          )}
          style={{
            backgroundColor: Colors.dark.surfaceLight,
            borderColor: Colors.dark.border,
          }}
        >
          <Plus
            size={14}
            color={isLocked || wagerAmount >= maxPoints ? Colors.dark.textMuted : Colors.dark.text}
            strokeWidth={2.5}
          />
        </button>
      </div>

      {/* Progress Track */}
      <div
        className="h-[3px] rounded-sm mb-3.5 overflow-hidden"
        style={{ backgroundColor: Colors.dark.surfaceLight }}
      >
        <div
          className="h-full rounded-sm transition-all duration-300"
          style={{
            width: `${Math.min(wagerPct, 100)}%`,
            backgroundColor: riskColor,
          }}
        />
      </div>

      {/* Presets Row */}
      <div className="flex gap-1.5 mb-3">
        {WAGER_PRESETS.filter((p) => p <= maxPoints).map((preset) => {
          const isActive = wagerAmount === preset;
          return (
            <button
              key={preset}
              onClick={() => handlePreset(preset)}
              disabled={isLocked}
              className={cn(
                'flex-1 py-2.5 rounded-[10px] border transition-all',
                'hover:opacity-80 active:scale-95',
                isLocked && 'opacity-35 cursor-not-allowed'
              )}
              style={{
                backgroundColor: isActive ? Colors.dark.accentDim : Colors.dark.surfaceLight,
                borderColor: isActive ? Colors.dark.accent : Colors.dark.border,
              }}
            >
              <span
                className="text-xs font-bold tabular-nums"
                style={{ color: isActive ? Colors.dark.accent : Colors.dark.textSecondary }}
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
            'flex-1 py-2.5 rounded-[10px] border transition-all',
            'hover:opacity-80 active:scale-95',
            isLocked && 'opacity-35 cursor-not-allowed'
          )}
          style={{
            backgroundColor: wagerAmount === maxPoints ? 'rgba(239, 68, 68, 0.25)' : Colors.dark.errorDim,
            borderColor: wagerAmount === maxPoints ? Colors.dark.error : 'rgba(239, 68, 68, 0.22)',
          }}
        >
          <span
            className="text-[10px] font-black tracking-[0.8px]"
            style={{ color: Colors.dark.error }}
          >
            ALL IN
          </span>
        </button>
      </div>

      {/* Balance Row */}
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-medium" style={{ color: Colors.dark.textMuted }}>
          Balance after wager
        </span>
        <span
          className="text-xs font-bold tabular-nums"
          style={{ color: Colors.dark.textSecondary }}
        >
          {(maxPoints - wagerAmount).toLocaleString()} pts
        </span>
      </div>
    </div>
  );
}
