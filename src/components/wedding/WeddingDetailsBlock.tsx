import React, { useState } from 'react';
import '../../styles/wedding-details-block.css';

interface CeremonyMoment {
  id: string;
  time: string;
  title: string;
  sanskrit: string;
  subtitle: string;
  icon: string;
}

interface CelebrationDay {
  date: string;
  dayOfWeek: string;
  badge?: string;
  events: CeremonyMoment[];
}

const CELEBRATION_SCHEDULE: CelebrationDay[] = [
  {
    date: '23 NOVEMBER 2026',
    dayOfWeek: 'Monday',
    events: [
      {
        id: 'shagun',
        time: '5:00 PM',
        title: 'Shagun',
        sanskrit: '॥ शुभ आरंभ ॥',
        subtitle: 'Sacred Family Blessings & Tilak',
        icon: 'spa',
      },
      {
        id: 'dinner-day1',
        time: '9:00 PM',
        title: 'Dinner',
        sanskrit: '॥ प्रीतिभोज ॥',
        subtitle: 'Royal Celebratory Feast',
        icon: 'restaurant',
      },
      {
        id: 'mehendi-sangeet',
        time: '9:30 PM',
        title: 'Mehendi / Sangeet',
        sanskrit: '॥ संगीत उत्सव ॥',
        subtitle: 'Henna, Melodies & Celebration',
        icon: 'music_note',
      },
    ],
  },
  {
    date: '24 NOVEMBER 2026',
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
      },
      {
        id: 'haldi',
        time: '10:00 AM',
        title: 'Haldi / Bangle Ceremony',
        sanskrit: '॥ हरिद्रा मंगलम् ॥',
        subtitle: 'Sunlit Turmeric & Auspicious Rituals',
        icon: 'flare',
      },
      {
        id: 'lunch',
        time: '1:00 PM',
        title: 'Lunch',
        sanskrit: '॥ आनंद भोजन ॥',
        subtitle: 'Traditional Midday Feast',
        icon: 'restaurant',
      },
      {
        id: 'barat',
        time: '8:00 PM',
        title: 'Barat',
        sanskrit: '॥ विवाह संस्कार ॥',
        subtitle: 'The Grand Procession & Sacred Vows',
        icon: 'celebration',
      },
    ],
  },
];

export const WeddingDetailsBlock: React.FC = () => {
  const [activeEventId, setActiveEventId] = useState<string>('shagun');

  return (
    <section className="wedding-details-section" id="wedding-celebrations" aria-label="Wedding Celebrations Schedule">
      {/* Heirloom Stationery Programme Card */}
      <div className="wedding-details-card">
        {/* Subtle Decorative Gold Corner Flourishes */}
        <div className="details-corner corner-tl" aria-hidden="true" />
        <div className="details-corner corner-tr" aria-hidden="true" />
        <div className="details-corner corner-bl" aria-hidden="true" />
        <div className="details-corner corner-br" aria-hidden="true" />

        {/* Section Heading */}
        <header className="details-header">
          <div className="details-ornament-row" aria-hidden="true">
            <span className="details-ornament-line" />
            <span className="details-ornament-symbol">❖</span>
            <span className="details-ornament-line" />
          </div>
          <h2 className="details-main-title">The Celebrations</h2>
          <p className="details-subtitle">A journey of sacred traditions, music &amp; joyful ceremonies</p>
        </header>

        {/* Ceremonial Journey Timeline */}
        <div className="details-days-group">
          {CELEBRATION_SCHEDULE.map((day, dayIndex) => (
            <div key={day.date} className="details-day-section">
              {/* Distinct Date Chapter Header */}
              <div className={`details-day-header ${day.badge ? 'main-event-day' : ''}`}>
                <span className="details-day-rule" aria-hidden="true" />
                <div className="details-date-title-wrap">
                  <span className="details-day-date">{day.date}</span>
                  {day.badge && (
                    <span className="details-main-event-badge">
                      <span className="badge-sparkle">✦</span>
                      <span>{day.badge}</span>
                      <span className="badge-sparkle">✦</span>
                    </span>
                  )}
                </div>
                <span className="details-day-rule reverse" aria-hidden="true" />
              </div>

              {/* Day Events Sequence */}
              <div className="details-events-list">
                {day.events.map((event) => {
                  const isActive = activeEventId === event.id;
                  return (
                    <article
                      key={event.id}
                      className={`details-event-card ${isActive ? 'is-active' : ''}`}
                      onClick={() => setActiveEventId(event.id)}
                      onMouseEnter={() => setActiveEventId(event.id)}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isActive}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveEventId(event.id);
                        }
                      }}
                    >
                      {/* Left: Time Badge */}
                      <div className="event-time-col">
                        <span className="details-time-pill">{event.time}</span>
                      </div>

                      {/* Timeline Node Marker */}
                      <div className="event-marker-col" aria-hidden="true">
                        <span className="marker-dot" />
                      </div>

                      {/* Right: Event Information */}
                      <div className="event-body-col">
                        <div className="event-title-row">
                          <h3 className="details-event-name">{event.title}</h3>
                          <span className="details-sanskrit-tag">{event.sanskrit}</span>
                        </div>
                        <p className="details-event-sub">{event.subtitle}</p>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Delicate Chapter Divider between 23 Nov and 24 Nov */}
              {dayIndex === 0 && (
                <div className="details-chapter-divider" aria-hidden="true">
                  <span className="details-divider-line" />
                  <span className="details-divider-symbol">❦</span>
                  <span className="details-divider-line" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Micro Sign-off */}
        <footer className="details-footer-accent">
          <span className="details-footer-dot" aria-hidden="true" />
          <span className="details-footer-text">CEREMONIAL ITINERARY • MANYA &amp; SARTHAK</span>
          <span className="details-footer-dot" aria-hidden="true" />
        </footer>
      </div>
    </section>
  );
};
