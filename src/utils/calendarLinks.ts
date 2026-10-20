import type { CelebrationEvent } from './apiClient';

export interface CalendarLinks {
  googleUrl: string;
  outlookUrl: string;
  icsHref: string;
}

interface CalendarDetails {
  events: CelebrationEvent[];
  title: string;
  googleTitle: string;
  location: string;
  venueName: string;
}

// Calendar entries for individual moments in the .ics file
const EVENT_DURATION_MS = 60 * 60 * 1000;

// 2026-11-23T11:30:00.000Z -> 20261123T113000Z
const toUtcStamp = (date: Date): string =>
  date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

// Escape text values per RFC 5545
const escapeIcsText = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

// ['A'] -> 'A', ['A', 'B'] -> 'A & B', ['A', 'B', 'C'] -> 'A, B & C'
const joinTitles = (titles: string[]): string =>
  titles.length <= 1
    ? titles.join('')
    : `${titles.slice(0, -1).join(', ')} & ${titles[titles.length - 1]}`;

// Builds Google, Outlook and Apple (.ics) calendar links that contain only the
// events passed in, i.e. the guest's permitted events.
export const buildCalendarLinks = ({
  events,
  title,
  googleTitle,
  location,
  venueName,
}: CalendarDetails): CalendarLinks | null => {
  if (events.length === 0) return null;

  const first = events[0];
  const last = events[events.length - 1];

  // Single-entry calendars span from the first permitted event until the end of
  // the last permitted day (Indian Standard Time).
  const spanStartIso = first.startsAt;
  const spanEndIso = `${last.startsAt.slice(0, 10)}T23:59:00+05:30`;
  const spanStart = new Date(spanStartIso);
  const spanEnd = new Date(spanEndIso);

  const summary = joinTitles(events.map((event) => event.title));

  const googleUrl =
    'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' +
    encodeURIComponent(googleTitle) +
    `&dates=${toUtcStamp(spanStart)}/${toUtcStamp(spanEnd)}` +
    '&details=' +
    encodeURIComponent(`${summary} at ${venueName}`) +
    '&location=' +
    encodeURIComponent(location);

  const outlookUrl =
    'https://outlook.live.com/calendar/0/deeplink/compose?subject=' +
    encodeURIComponent(title) +
    `&startdt=${encodeURIComponent(spanStartIso)}&enddt=${encodeURIComponent(spanEndIso)}` +
    '&body=' +
    encodeURIComponent(`${summary} at ${venueName}`) +
    '&location=' +
    encodeURIComponent(location);

  // Apple Calendar file: one entry per permitted event
  const stamp = toUtcStamp(new Date());
  const icsEvents = events.flatMap((event) => {
    const start = new Date(event.startsAt);
    const end = new Date(start.getTime() + EVENT_DURATION_MS);
    return [
      'BEGIN:VEVENT',
      `UID:${event.id}@manya-sarthak-wedding`,
      `DTSTAMP:${stamp}`,
      `SUMMARY:${escapeIcsText(`${event.title} — ${title}`)}`,
      `DESCRIPTION:${escapeIcsText(event.subtitle)}`,
      `LOCATION:${escapeIcsText(location)}`,
      `DTSTART:${toUtcStamp(start)}`,
      `DTEND:${toUtcStamp(end)}`,
      'END:VEVENT',
    ];
  });

  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Manya and Sarthak Wedding//EN',
    'CALSCALE:GREGORIAN',
    ...icsEvents,
    'END:VCALENDAR',
  ].join('\r\n');

  return {
    googleUrl,
    outlookUrl,
    icsHref: `data:text/calendar;charset=utf8,${encodeURIComponent(icsData)}`,
  };
};
