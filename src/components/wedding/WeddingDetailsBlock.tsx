import React, { useState } from 'react';
import '../../styles/wedding-details-block.css';
import type { CelebrationDay } from '../../utils/apiClient';

interface WeddingDetailsBlockProps {
  // Only the events permitted by the guest's invitation, filtered by the server
  schedule: CelebrationDay[];
}

export const WeddingDetailsBlock: React.FC<WeddingDetailsBlockProps> = ({ schedule }) => {
  // Highlight the first permitted event (Shagun when the guest is invited to it)
  const [activeEventId, setActiveEventId] = useState<string>(
    () => schedule[0]?.events[0]?.id ?? ''
  );

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
          {schedule.map((day, dayIndex) => (
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

              {/* Delicate Chapter Divider between consecutive celebration days */}
              {dayIndex < schedule.length - 1 && (
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
