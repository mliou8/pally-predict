// Standardized animation durations
// Use these constants for consistent animation timing across the app

export const ANIMATION_DURATION = {
  fast: 'duration-200',
  normal: 'duration-300',
  slow: 'duration-500',
  page: 'duration-700',
} as const;

// Stagger delays for sequential animations
export const STAGGER_DELAY = {
  fast: 50,
  normal: 100,
  slow: 150,
} as const;

// Combined transition classes
export const TRANSITIONS = {
  fade: 'transition-opacity',
  scale: 'transition-transform',
  all: 'transition-all',
  fadeIn: 'transition-all duration-500',
  fadeInSlow: 'transition-all duration-700',
  button: 'transition-all duration-200 active:scale-[0.98]',
} as const;
