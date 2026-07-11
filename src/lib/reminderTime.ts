import type { Reminder } from '@/db/schema';

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // index = weekday - 1

function parseTime(timeOfDay: string): { hour: number; minute: number } {
  const [h, m] = timeOfDay.split(':').map(Number);
  return { hour: h, minute: m };
}

// Our weekday: 1=Mon..7=Sun. JS getDay(): 0=Sun..6=Sat.
function jsDayToOurs(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

// Next wall-clock occurrence (EC-5: "today at an earlier time" rolls forward).
export function nextFireTime(reminder: Reminder, now: Date = new Date()): Date | null {
  if (reminder.kind === 'once') {
    if (!reminder.atDatetime || reminder.atDatetime <= now.getTime()) return null; // fired/expired
    return new Date(reminder.atDatetime);
  }
  if (!reminder.timeOfDay) return null;
  const { hour, minute } = parseTime(reminder.timeOfDay);
  const candidate = new Date(now);
  candidate.setHours(hour, minute, 0, 0);
  if (reminder.kind === 'daily') {
    if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }
  // weekly
  if (!reminder.weekday) return null;
  let delta = (reminder.weekday - jsDayToOurs(candidate.getDay()) + 7) % 7;
  if (delta === 0 && candidate <= now) delta = 7;
  candidate.setDate(candidate.getDate() + delta);
  return candidate;
}

export function scheduleSummary(reminder: Reminder): string {
  if (reminder.kind === 'once') {
    return reminder.atDatetime
      ? `Once · ${new Date(reminder.atDatetime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
      : 'Once';
  }
  if (reminder.kind === 'daily') return `Daily · ${reminder.timeOfDay}`;
  const day = reminder.weekday ? WEEKDAY_LABELS[reminder.weekday - 1] : '?';
  return `Weekly · ${day} · ${reminder.timeOfDay}`;
}
