import React, { useState, useRef, useEffect } from 'react';

export const VenueCelebrationSection: React.FC = () => {
  const [isCalOpen, setIsCalOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  // Close calendar menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(event.target as Node)) {
        setIsCalOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Google Calendar URL for 23 Nov 2026 to 24 Nov 2026
  const googleCalUrl =
    'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' +
    encodeURIComponent('Wedding Celebration of Manya & Sarthak') +
    '&dates=20261123T043000Z/20261124T183000Z' +
    '&details=' +
    encodeURIComponent('Shagun, Mehendi, Haldi & Barat at Oodles Hotel Chhattarpur') +
    '&location=' +
    encodeURIComponent('Oodles Hotel Chhattarpur, New Delhi');

  // Simple ICS data URI for Apple Calendar
  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Manya and Sarthak Wedding//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'SUMMARY:Wedding of Manya & Sarthak',
    'DESCRIPTION:Shagun, Mehendi, Haldi & Barat',
    'LOCATION:Oodles Hotel Chhattarpur, New Delhi',
    'DTSTART:20261123T043000Z',
    'DTEND:20261124T183000Z',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const icsFileHref = `data:text/calendar;charset=utf8,${encodeURIComponent(icsData)}`;

  const outlookCalUrl =
    'https://outlook.live.com/calendar/0/deeplink/compose?subject=' +
    encodeURIComponent('Wedding of Manya & Sarthak') +
    '&startdt=2026-11-23T10:00:00&enddt=2026-11-24T23:59:00' +
    '&body=' +
    encodeURIComponent('Shagun, Mehendi, Haldi & Barat at Oodles Hotel Chhattarpur') +
    '&location=' +
    encodeURIComponent('Oodles Hotel Chhattarpur, New Delhi');

  return (
    <section className="venue-celebration-section" id="venue-section">
      {/* 1. Traditional Sanskrit Blessing Motif */}
      <div className="venue-blessing-header">
        <span className="blessing-rule" />
        <span className="blessing-text">मंगलम् भगवान विष्णुः</span>
        <span className="blessing-rule" />
      </div>

      {/* 2. Header Section: Clean, warm, romantic heading */}
      <div className="venue-title-group">
        <span className="venue-tagline">The Celebration Awaits</span>
        <h2 className="venue-main-heading">Come Celebrate With Us</h2>
        <p className="venue-romantic-line">
          “Two hearts, two families, and endless blessings under the starlit skies.”
        </p>
      </div>

      {/* 3. Hotel Facade Keepsake Card */}
      <div className="venue-facade-container">
        <div className="venue-facade-outer-frame">
          <div className="venue-facade-inner-canvas">
            {/* Corner Botanical Flourishes */}
            <div className="facade-corner-accent corner-top-left" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" className="corner-flourish-svg">
                <path d="M4 4C14 6 22 14 24 24C14 22 6 14 4 4Z" fill="#C5A059" fillOpacity="0.3" />
                <circle cx="16" cy="16" r="6" fill="#FDF2F4" fillOpacity="0.8" />
                <path d="M4 24C8 28 14 30 20 30" stroke="#775A19" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="facade-corner-accent corner-top-right" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" className="corner-flourish-svg">
                <path d="M4 4C14 6 22 14 24 24C14 22 6 14 4 4Z" fill="#C5A059" fillOpacity="0.3" />
                <circle cx="16" cy="16" r="6" fill="#FDF2F4" fillOpacity="0.8" />
                <path d="M4 24C8 28 14 30 20 30" stroke="#775A19" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Artwork Canvas Container */}
            <div className="facade-artwork-wrap">
              <img
                src="/images/hotel-facade-illustration.jpg"
                alt="Hand-painted luxury watercolor illustration of Oodles Hotel Chhattarpur framed with blush roses and palm trees"
                className="facade-image"
                loading="lazy"
              />
              <div className="facade-gradient-overlay" />

              {/* Floating Venue Badge */}
              <div className="venue-floating-badge">
                <span className="material-symbols-outlined venue-pin-icon">location_on</span>
                <span className="venue-badge-text">Oodles Hotel Chhattarpur</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Structural Insertion Point: Future Scroll-Driven Event Timeline */}
      <div className="venue-timeline-insertion-point" id="venue-timeline-area" />

      {/* 5. Primary Glowing Champagne-Gold Location Button & Calendar Action */}
      <div className="venue-actions-wrapper">
        <a
          href="https://www.google.com/maps/place/Oodles+Hotel+Chhattarpur/@28.48875,77.184769,17z/data=!3m1!4b1!4m9!3m8!1s0x390d1e11afc66825:0xaacf1c3acf14c0!5m2!4m1!1i2!8m2!3d28.48875!4d77.184769!16s%2Fg%2F11xfjmp3l!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDkxNi4wIKXMDSoASAFQAw%3D%3D"
          target="_blank"
          rel="noopener noreferrer"
          className="venue-map-cta-btn"
          id="see-location-map-btn"
        >
          <span className="material-symbols-outlined map-btn-icon">pin_drop</span>
          <span className="map-btn-text">SEE LOCATION ON THE MAP</span>
        </a>

        {/* 6. Second Action: Book that date in your calendar */}
        <div className="calendar-action-container" ref={calRef}>
          <button
            type="button"
            className="calendar-invite-btn"
            id="calendar-invite-btn"
            onClick={() => setIsCalOpen((prev) => !prev)}
            aria-expanded={isCalOpen}
            aria-haspopup="true"
          >
            <span className="material-symbols-outlined cal-btn-icon">calendar_today</span>
            <span className="cal-btn-text">Book that date in your calendar.</span>
            <span className="material-symbols-outlined cal-chevron-icon">
              {isCalOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isCalOpen && (
            <div className="calendar-dropdown-menu" role="menu">
              <a
                href={googleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cal-menu-item"
                role="menuitem"
                onClick={() => setIsCalOpen(false)}
              >
                <span className="material-symbols-outlined cal-item-icon">event</span>
                <span>Google Calendar</span>
              </a>
              <a
                href={icsFileHref}
                download="manya-sarthak-wedding.ics"
                className="cal-menu-item"
                role="menuitem"
                onClick={() => setIsCalOpen(false)}
              >
                <span className="material-symbols-outlined cal-item-icon">phone_iphone</span>
                <span>Apple Calendar (.ics)</span>
              </a>
              <a
                href={outlookCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cal-menu-item"
                role="menuitem"
                onClick={() => setIsCalOpen(false)}
              >
                <span className="material-symbols-outlined cal-item-icon">mail</span>
                <span>Outlook Calendar</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 6. Subtle Invitation Monogram Sign-off */}
      <footer className="venue-footer-signoff">
        <div className="signoff-monogram-row">
          <span className="signoff-rule" />
          <span className="signoff-monogram">M &amp; S</span>
          <span className="signoff-rule" />
        </div>
        <p className="signoff-blessing">With the blessings of our elders and families</p>
        <p className="signoff-location">Oodles Hotel Chhattarpur</p>
      </footer>
    </section>
  );
};
