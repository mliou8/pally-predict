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

const CARD_LABELS = ['A', 'B', 'C', 'D'];

export default function AnswerCard({ text, index, isSelected, isLocked, onPress }: AnswerCardProps) {
  const [isAnimated, setIsAnimated] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const colors = OPTION_COLORS[index % OPTION_COLORS.length];

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), index * 80 + 120);
    return () => clearTimeout(timer);
  }, [index]);

  const handleClick = () => {
    if (isLocked) return;
    onPress();
  };

  return (
    <div
      className={cn(
        'w-[48%] mb-3 transition-all duration-300',
        isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      )}
    >
      <button
        onClick={handleClick}
        disabled={isLocked}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        className={cn(
          'w-full rounded-2xl overflow-hidden min-h-[120px] relative transition-all duration-150',
          'border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0D15]',
          isPressed && !isLocked && 'scale-[0.97]',
          isLocked && !isSelected && 'opacity-30 cursor-not-allowed',
          !isLocked && 'cursor-pointer hover:scale-[0.98]'
        )}
        style={{
          backgroundColor: isSelected ? colors.bg : Colors.dark.surface,
          borderColor: isSelected ? colors.border : Colors.dark.border,
          borderWidth: isSelected ? '1.5px' : '1px',
        }}
      >
        {isSelected && (
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: colors.border }}
          />
        )}

        <div className="p-4 flex flex-col justify-between min-h-[120px]">
          <div className="flex justify-between items-center mb-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: isSelected ? colors.glow : Colors.dark.surfaceLight,
              }}
            >
              <span
                className="text-xs font-extrabold tracking-wide"
                style={{ color: isSelected ? colors.text : Colors.dark.textMuted }}
              >
                {CARD_LABELS[index]}
              </span>
            </div>
            {isSelected && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.border }}
              >
                <Check size={9} color="#fff" strokeWidth={3.5} />
              </div>
            )}
          </div>

          <p
            className="text-[13px] font-bold leading-[18px] tracking-tight"
            style={{ color: isSelected ? colors.text : Colors.dark.text }}
          >
            {text}
          </p>
        </div>
      </button>
    </div>
  );
}
