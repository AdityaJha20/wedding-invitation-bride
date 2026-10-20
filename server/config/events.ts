// Server-owned wedding event catalog.
// This is the single source of truth for the celebration schedule. It is never
// shipped to the browser in full: guests receive only the events their
// invitation allows (see buildScheduleForEvents).

export interface CatalogEvent {
  id: string;
  time: string;
  title: string;
  sanskrit: string;
  subtitle: string;
  icon: string;
  // Exact start in Indian Standard Time, used for calendar exports
  startsAt: string;
}

export interface CatalogDay {
  date: string;
  isoDate: string;
  dayOfWeek: string;
  badge?: string;
  events: CatalogEvent[];
}

export interface InvitationPreset {
  id: string;
  label: string;
  eventIds: string[];
}

export const EVENT_CATALOG: readonly CatalogDay[] = [
  {
    date: '23 NOVEMBER 2026',
    isoDate: '2026-11-23',
    dayOfWeek: 'Monday',
    events: [
      {
        id: 'shagun',
        time: '5:00 PM',
        title: 'Shagun',
        sanskrit: '॥ शुभ आरंभ ॥',
        subtitle: 'Sacred Family Blessings & Tilak',
        icon: 'spa',
        startsAt: '2026-11-23T17:00:00+05:30',
      },
      {
        id: 'dinner-day1',
        time: '9:00 PM',
        title: 'Dinner',
        sanskrit: '॥ प्रीतिभोज ॥',
        subtitle: 'Royal Celebratory Feast',
        icon: 'restaurant',
        startsAt: '2026-11-23T21:00:00+05:30',
      },
      {
        id: 'mehendi-sangeet',
        time: '9:30 PM',
        title: 'Mehendi / Sangeet',
        sanskrit: '॥ संगीत उत्सव ॥',
        subtitle: 'Henna, Melodies & Celebration',
        icon: 'music_note',
        startsAt: '2026-11-23T21:30:00+05:30',
      },
    ],
  },
  {
    date: '24 NOVEMBER 2026',
    isoDate: '2026-11-24',
    dayOfWeek: 'Tuesday',
    badge: 'MAIN EVENT',
    events: [
      {
        id: 'breakfast',
        time: '9:00 AM',
        title: 'Breakfast',
        sanskrit: '॥ प्रातः कलेवा ॥',
        subtitle: 'Morning Delights & Chai',
        icon: 'coffee',
        startsAt: '2026-11-24T09:00:00+05:30',
      },
      {
        id: 'haldi',
        time: '10:00 AM',
        title: 'Haldi / Bangle Ceremony',
        sanskrit: '॥ हरिद्रा मंगलम् ॥',
        subtitle: 'Sunlit Turmeric & Auspicious Rituals',
        icon: 'flare',
        startsAt: '2026-11-24T10:00:00+05:30',
      },
      {
        id: 'lunch',
        time: '1:00 PM',
        title: 'Lunch',
        sanskrit: '॥ आनंद भोजन ॥',
        subtitle: 'Traditional Midday Feast',
        icon: 'restaurant',
        startsAt: '2026-11-24T13:00:00+05:30',
      },
      {
        id: 'barat',
        time: '8:00 PM',
        title: 'Barat',
        sanskrit: '॥ विवाह संस्कार ॥',
        subtitle: 'The Grand Procession & Sacred Vows',
        icon: 'celebration',
        startsAt: '2026-11-24T20:00:00+05:30',
      },
    ],
  },
];

// Event IDs in catalog (chronological) order
export const EVENT_IDS: readonly string[] = EVENT_CATALOG.flatMap((day) =>
  day.events.map((event) => event.id)
);

const EVENT_ID_SET = new Set(EVENT_IDS);

export const isKnownEventId = (id: unknown): id is string =>
  typeof id === 'string' && EVENT_ID_SET.has(id);

// Starting points for the admin form; every selection can be changed manually.
export const INVITATION_PRESETS: readonly InvitationPreset[] = [
  {
    id: 'family',
    label: 'Family',
    eventIds: [...EVENT_IDS],
  },
  {
    id: 'close-friends',
    label: 'Close Friends',
    eventIds: ['dinner-day1', 'mehendi-sangeet', 'breakfast', 'haldi', 'lunch', 'barat'],
  },
  {
    id: 'friends',
    label: 'Friends',
    eventIds: ['dinner-day1', 'mehendi-sangeet', 'barat'],
  },
  {
    id: 'colleagues',
    label: 'Colleagues',
    eventIds: ['barat'],
  },
];

// Deduplicates and returns IDs in catalog order (assumes IDs were validated)
export const normalizeEventIds = (ids: readonly string[]): string[] => {
  const wanted = new Set(ids);
  return EVENT_IDS.filter((id) => wanted.has(id));
};

// Builds the schedule containing only the allowed events. Days without any
// allowed event are dropped entirely, together with their date and badge.
export const buildScheduleForEvents = (allowedEventIds: readonly string[]): CatalogDay[] => {
  const allowed = new Set(allowedEventIds);

  return EVENT_CATALOG.map((day) => {
    const events = day.events
      .filter((event) => allowed.has(event.id))
      .map((event) => ({
        id: event.id,
        time: event.time,
        title: event.title,
        sanskrit: event.sanskrit,
        subtitle: event.subtitle,
        icon: event.icon,
        startsAt: event.startsAt,
      }));

    const filteredDay: CatalogDay = {
      date: day.date,
      isoDate: day.isoDate,
      dayOfWeek: day.dayOfWeek,
      events,
    };
    if (day.badge) filteredDay.badge = day.badge;
    return filteredDay;
  }).filter((day) => day.events.length > 0);
};
