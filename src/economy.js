// Dance With Mary Jane — economy core.
// Pure functions, no I/O. Single source of truth for earning & spending rules.
// See docs/SPEC.md.

export const EARN = { daily: 1, workout: 1, friday: 5, cleaning: 1, danish: 1, grocery: 1 };

export const BASE_COST = {
  oneHitter: 1, pipe: 3, bong: 5,
  xmax: 1, xq2small: 3, xq2large: 5,
};

/** Display names for the UI. Internal keys above stay stable. */
export const CURRENCY = 'Smoke Coins';
export const DISPLAY = {
  oneHitter: 'One-hitter', pipe: 'Pipe', bong: 'Bong / Joint',
  xmax: 'XMax', xq2small: 'XQ2 small', xq2large: 'XQ2 large',
};

/** Lose 1 Smoke Coin for giving in to the munchies (overeating). */
export const MUNCHIES_PENALTY = 1;

export const EXCEPTIONALS_PER_MONTH = 2;
export const CLEANING_PER_WEEK = 2;
export const CLEANING_PER_DAY = 1;
export const WORKOUT_PER_WEEK = 5;
export const WORKOUT_PER_DAY = 1;
export const MUNCHIES_PER_DAY = 1;
export const DANISH_PER_DAY = 1;
export const GROCERY_PER_WEEK = 2;
export const GROCERY_PER_DAY = 1;
export const VACATION_LEAD_DAYS = 7;

/** Is this Date a work day? Mon–Fri and not marked as a day off. */
export function isWorkDay(date, daysOff = new Set()) {
  const dow = date.getDay(); // 0 Sun .. 6 Sat
  const isWeekday = dow >= 1 && dow <= 5;
  return isWeekday && !daysOff.has(dayKey(date));
}

/**
 * Multiplier: starts at 1.
 *  +1 on a "grind day" — a work day whose next day is also a work day, so
 *    Friday (and the last work day before any time off) counts as weekend.
 *  +1 if before 6pm — any day, to keep wake-and-bake expensive everywhere.
 * Range 1–3.
 */
export function multiplier(date, daysOff = new Set()) {
  let m = 1;
  if (isGrindDay(date, daysOff)) m += 1;
  if (date.getHours() < 18) m += 1;
  return m;
}

/** A work day whose following day is also a work day. */
export function isGrindDay(date, daysOff = new Set()) {
  return isWorkDay(date, daysOff) && isWorkDay(nextDay(date), daysOff);
}

/** Final cost of a smoke action at a given moment. */
export function costOf(action, date, daysOff = new Set()) {
  const base = BASE_COST[action];
  if (base == null) throw new Error(`Unknown action: ${action}`);
  return base * multiplier(date, daysOff);
}

/** Can I afford this action right now? */
export function canAfford(balance, action, date, daysOff = new Set()) {
  return balance >= costOf(action, date, daysOff);
}

/** Whether a vacation day may be scheduled (>= 7 days out). */
export function canMarkDayOff(targetDate, now = new Date()) {
  const ms = startOfDay(targetDate) - startOfDay(now);
  return ms >= VACATION_LEAD_DAYS * 86400000;
}

// --- helpers ---
export function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function nextDay(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
}
