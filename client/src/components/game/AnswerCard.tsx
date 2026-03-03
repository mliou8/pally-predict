import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import Colors, { OPTION_COLORS } from '@/constants/colors';
import { cn } from '@/lib/utils';

interface AnswerCardProps {
  text: string;
  index: number;
  isSelected: boolean;
  isLocked: boolean;
  onPress: () => void;
}

export default function AnswerCard({ text, index, isSelected, isLocked, onPress }: AnswerCardProps) {
  const [isAnimated, setIsAnimated] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const colors = OPTION_COLORS[index % OPTION_COLORS.length];

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), index * 60 + 100);
    return () => clearTimeout(timer);
  }, [index]);

  const handleClick = () => {
    if (isLocked) return;
    // TODO: Add haptic feedback for mobile devices
    // if (navigator.vibrate) navigator.vibrate(10);
    onPress();
  };

  // Large watermark letter (A, B, C, D)
  const optionLabels = ['A', 'B', 'C', 'D'];
  const optionLabel = optionLabels[index] || String.fromCharCode(65 + index);

  return (
    <div
      className={cn(
        'w-full mb-3 transition-all duration-300',
        isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <button
        onClick={handleClick}
        disabled={isLocked}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        className={cn(
          'w-full rounded-xl overflow-hidden min-h-[72px] relative transition-all duration-200',
          'focus:outline-none',
          isPressed && !isLocked && 'scale-[0.98]',
          isLocked && !isSelected && 'opacity-25',
          !isLocked && 'cursor-pointer active:scale-[0.98]'
        )}
        style={{
          backgroundColor: isSelected ? colors.bg : Colors.dark.surface,
        }}
      >
        {/* Watermark number */}
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[48px] font-black select-none pointer-events-none"
          style={{
            color: isSelected ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.03)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {optionLabel}
        </div>

        <div className="relative p-4 flex items-center gap-3">
          {/* Selection indicator */}
          {isSelected && (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
            >
              <Check size={14} color="#000" strokeWidth={3} />
            </div>
          )}

          {/* Answer text */}
          <div className={cn('flex-1 pr-16', !isSelected && 'pl-9')}>
            <p
              className="text-[15px] font-semibold leading-tight"
              style={{
                color: isSelected ? colors.text : Colors.dark.text,
              }}
            >
              {text}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
