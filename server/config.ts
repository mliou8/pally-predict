// Server configuration constants

// Question cycle duration in hours (time between question drop and reveal)
export const QUESTION_CYCLE_HOURS = 24;

// Question cycle duration in milliseconds
export const QUESTION_CYCLE_MS = QUESTION_CYCLE_HOURS * 60 * 60 * 1000;

// Question drop times in ET (24-hour format)
// With 24-hour cycles: noon ET daily
export const QUESTION_DROP_TIMES_ET = [12];
