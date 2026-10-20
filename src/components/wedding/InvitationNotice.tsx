import React from 'react';
import '../../styles/wedding-details-block.css';

export type InvitationNoticeReason = 'no-link' | 'unavailable' | 'error';

const NOTICE_MESSAGES: Record<InvitationNoticeReason, string> = {
  'no-link': 'Please open your personal invitation link to view your celebration details.',
  unavailable:
    'This invitation link is no longer active. Please reach out to the family for your personal invitation.',
  error: 'We could not load your celebration details just now. Please refresh the page to try again.',
};

interface InvitationNoticeProps {
  reason: InvitationNoticeReason;
}

// Shown in place of the date reveal and schedule when no valid personal
// invitation is open. Reuses the celebration card styling.
export const InvitationNotice: React.FC<InvitationNoticeProps> = ({ reason }) => {
  return (
    // Keeps the Hero "Reveal The Wedding Date" anchor working
    <section className="wedding-details-section" id="scratch-card" aria-label="Celebration Details">
      <div className="wedding-details-card">
        {/* Subtle Decorative Gold Corner Flourishes */}
        <div className="details-corner corner-tl" aria-hidden="true" />
        <div className="details-corner corner-tr" aria-hidden="true" />
        <div className="details-corner corner-bl" aria-hidden="true" />
        <div className="details-corner corner-br" aria-hidden="true" />

        <header className="details-header invitation-notice-header">
          <div className="details-ornament-row" aria-hidden="true">
            <span className="details-ornament-line" />
            <span className="details-ornament-symbol">❖</span>
            <span className="details-ornament-line" />
          </div>
          <h2 className="details-main-title">The Celebrations</h2>
          <p className="details-subtitle invitation-notice-message" role="status">
            {NOTICE_MESSAGES[reason]}
          </p>
        </header>

        <footer className="details-footer-accent">
          <span className="details-footer-dot" aria-hidden="true" />
          <span className="details-footer-text">WITH LOVE • MANYA &amp; SARTHAK</span>
          <span className="details-footer-dot" aria-hidden="true" />
        </footer>
      </div>
    </section>
  );
};
