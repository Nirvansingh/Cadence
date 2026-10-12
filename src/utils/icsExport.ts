import type { TimetableSlot, DayOfWeek } from '../types';

const DAY_MAP: Record<DayOfWeek, string> = {
  Monday: 'MO',
  Tuesday: 'TU',
  Wednesday: 'WE',
  Thursday: 'TH',
  Friday: 'FR',
  Saturday: 'SA',
  Sunday: 'SU'
};

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) string for recurring weekly timetable slots
 */
export function generateICalendar(slots: TimetableSlot[], calendarName = 'Cadence Schedule'): string {
  const pad = (n: number) => n.toString().padStart(2, '0');

  // Find the date for the coming Monday as anchor
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sun, 1 is Mon
  const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const dayOffsets: Record<DayOfWeek, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cadence Productivity//Student Timetable//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:UTC'
  ];

  slots.forEach(slot => {
    const offset = dayOffsets[slot.dayOfWeek];
    const eventDate = new Date(monday);
    eventDate.setDate(monday.getDate() + offset);

    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);

    const startStr = `${eventDate.getFullYear()}${pad(eventDate.getMonth() + 1)}${pad(eventDate.getDate())}T${pad(startH)}${pad(startM)}00`;
    const endStr = `${eventDate.getFullYear()}${pad(eventDate.getMonth() + 1)}${pad(eventDate.getDate())}T${pad(endH)}${pad(endM)}00`;

    const byDay = DAY_MAP[slot.dayOfWeek];

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:cadence_${slot.id}@local`);
    lines.push(`DTSTAMP:${startStr}Z`);
    lines.push(`DTSTART:${startStr}`);
    lines.push(`DTEND:${endStr}`);
    lines.push(`SUMMARY:${slot.title}`);
    lines.push(`DESCRIPTION:${slot.note || slot.category.toUpperCase()}`);
    lines.push(`CATEGORIES:${slot.category.toUpperCase()}`);
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Triggers a browser download of the .ics file
 */
export function downloadICalendarFile(slots: TimetableSlot[], filename = 'cadence-schedule.ics') {
  const content = generateICalendar(slots);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
