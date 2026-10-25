/**
 * Date and timezone helper utilities for Cadence.
 * Ensures consistent local-date formatting ('YYYY-MM-DD') without UTC conversion offset bugs.
 */

import type { DayOfWeek } from '../types';

/**
 * Returns 'YYYY-MM-DD' formatted for the user's local timezone.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns DayOfWeek for a given date or current time
 */
export function getLocalDayOfWeek(d: Date = new Date()): DayOfWeek {
  const dayIndex = d.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
}

/**
 * Converts 'HH:MM' 24-hr time to total minutes from midnight
 */
export function timeStrToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts minutes from midnight back to 'HH:MM' string
 */
export function minutesToTimeStr(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = String(Math.floor(normalized / 60)).padStart(2, '0');
  const m = String(normalized % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Checks if current local time falls inside a slot on the given day
 */
export function isCurrentSlot(dayOfWeek: DayOfWeek, startTime: string, endTime: string, now: Date = new Date()): boolean {
  if (getLocalDayOfWeek(now) !== dayOfWeek) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startM = timeStrToMinutes(startTime);
  const endM = timeStrToMinutes(endTime);

  // If slot does not cross midnight
  if (endM > startM) {
    return currentMinutes >= startM && currentMinutes < endM;
  }
  // If slot crosses midnight (e.g. 23:00 to 07:00)
  return currentMinutes >= startM || currentMinutes < endM;
}
