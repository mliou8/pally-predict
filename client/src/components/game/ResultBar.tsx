import React, { useEffect, useState } from 'react';
import { Check, Crown } from 'lucide-react';
import Colors, { OPTION_COLORS } from '@/constants/colors';
import { cn } from '@/lib/utils';

interface ResultBarProps {
  text: string;
  emoji?: string;
  percentage: number;
  count: number;
  index: number;
  isWinner: boolean;
  isUserPick: boolean;
  delay?: number;
}

export default function ResultBar({
  text,
  emoji,
  percentage,
  count,
  index,
  isWinner,
  isUserPick,
  delay = 0,
}: ResultBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const colors = OPTION_COLORS[index % OPTION_COLORS.length];

  useEffect(() => {
    const visibleTimer = setTimeout(() => setIsVisible(true), delay);
    const widthTimer = setTimeout(() => setAnimatedWidth(percentage), delay + 100);

    return () => {
      clearTimeout(visibleTimer);
      clearTimeout(widthTimer);
    };
  }, [percentage, delay]);

  return (
    <div
      className={cn(
        'mb-2 rounded-[14px] p-3.5 border overflow-hidden relative transition-all duration-350',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3.5'
      )}
      style={{
        backgroundColor: isWinner ? 'rgba(255, 107, 53, 0.04)' : Colors.dark.surface,
        borderColor: isWinner ? 'rgba(255, 107, 53, 0.22)' : Colors.dark.border,
      }}
    >
      {isWinner && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: colors.border }}
        />
      )}

      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2.5 flex-1">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[17px]"
            style={{
              backgroundColor: isWinner ? colors.glow : Colors.dark.surfaceLight,
            }}
          >
            {emoji || text.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-[5px] mb-[3px]">
              <span
                className={cn('text-[13px]', isWinner ? 'font-bold' : 'font-semibold')}
                style={{ color: isWinner ? colors.text : Colors.dark.text }}
              >
                {text}
              </span>
              {isWinner && <Crown size={11} color={Colors.dark.accent} fill={Colors.dark.accent} />}
            </div>
            <div className="flex items-center gap-1.5">
              {isUserPick && (
                <div
                  className="flex items-center gap-[3px] px-1.5 py-0.5 rounded border"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                  }}
                >
                  <Check size={7} color={colors.text} strokeWidth={3.5} />
                  <span
                    className="text-[8px] font-extrabold tracking-[0.5px]"
                    style={{ color: colors.text }}
                  >
                    YOU
                  </span>
                </div>
              )}
              <span className="text-[10px] tabular-nums font-medium" style={{ color: Colors.dark.textMuted }}>
                {(count ?? 0).toLocaleString()} votes
              </span>
            </div>
          </div>
        </div>
        <span
          className="text-xl font-extrabold tabular-nums ml-2"
          style={{ color: isWinner ? colors.text : Colors.dark.textSecondary }}
        >
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="h-1 rounded-sm overflow-hidden"
        style={{ backgroundColor: Colors.dark.surfaceHighlight }}
      >
        <div
          className="h-full rounded-sm transition-all duration-900 ease-out"
          style={{
            width: `${animatedWidth}%`,
            backgroundColor: isWinner ? colors.border : colors.fill,
          }}
        />
      </div>
    </div>
  );
}
