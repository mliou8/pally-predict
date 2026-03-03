// Colors constant - maintained for backward compatibility
// These values match the CSS variables in index.css
// New code should prefer using Tailwind classes (bg-background, text-foreground, etc.)

const Colors = {
  dark: {
    // Core backgrounds - true black for contrast
    background: '#000000',
    backgroundAlt: '#0A0A0A',
    surface: '#111111',
    surfaceLight: '#1A1A1A',
    surfaceHighlight: '#222222',
    surfaceBright: '#2A2A2A',
    card: '#111111',

    // Borders - subtle
    border: '#1A1A1A',
    borderLight: '#252525',
    borderBright: '#333333',

    // Text - high contrast
    text: '#FFFFFF',
    textSecondary: '#999999',
    textMuted: '#666666',

    // Primary accent - lime green (distinctive)
    accent: '#BFFF00',
    accentSoft: '#A3E000',
    accentDim: 'rgba(191, 255, 0, 0.08)',
    accentGlow: 'rgba(191, 255, 0, 0.15)',
    accentBright: 'rgba(191, 255, 0, 0.25)',

    // Semantic colors
    success: '#00FF88',
    successDim: 'rgba(0, 255, 136, 0.10)',
    warning: '#FFE600',
    warningDim: 'rgba(255, 230, 0, 0.10)',
    error: '#FF3366',
    errorDim: 'rgba(255, 51, 102, 0.10)',

    // Secondary accents
    blue: '#00D4FF',
    blueDim: 'rgba(0, 212, 255, 0.10)',
    pink: '#FF00AA',
    pinkDim: 'rgba(255, 0, 170, 0.10)',
    teal: '#00FFCC',
    tealDim: 'rgba(0, 255, 204, 0.10)',
    violet: '#AA66FF',
    violetDim: 'rgba(170, 102, 255, 0.10)',

    // Tab bar
    tabBar: '#000000',
    tabBarBorder: '#1A1A1A',

    // Glass effect
    glass: 'rgba(0, 0, 0, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.06)',
  },
};

// Answer option colors - bold, full saturation
export interface OptionColor {
  bg: string;
  bgDim: string;
  border: string;
  text: string;
  textAlt: string;
  glow: string;
  fill: string;
}

export const OPTION_COLORS: OptionColor[] = [
  { bg: '#BFFF00', bgDim: 'rgba(191, 255, 0, 0.12)', border: '#BFFF00', text: '#000000', textAlt: '#BFFF00', glow: 'rgba(191, 255, 0, 0.3)', fill: '#BFFF00' },
  { bg: '#00D4FF', bgDim: 'rgba(0, 212, 255, 0.12)', border: '#00D4FF', text: '#000000', textAlt: '#00D4FF', glow: 'rgba(0, 212, 255, 0.3)', fill: '#00D4FF' },
  { bg: '#FF00AA', bgDim: 'rgba(255, 0, 170, 0.12)', border: '#FF00AA', text: '#000000', textAlt: '#FF00AA', glow: 'rgba(255, 0, 170, 0.3)', fill: '#FF00AA' },
  { bg: '#FFE600', bgDim: 'rgba(255, 230, 0, 0.12)', border: '#FFE600', text: '#000000', textAlt: '#FFE600', glow: 'rgba(255, 230, 0, 0.3)', fill: '#FFE600' },
];

export default Colors;
