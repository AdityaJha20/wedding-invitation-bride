import React from 'react';
import { HeroSection } from './HeroSection';
import { OurStorySection } from './OurStorySection';
import { ScratchDateSection } from './ScratchDateSection';
import { WeddingDetailsBlock } from './WeddingDetailsBlock';
import { VenueCelebrationSection } from './VenueCelebrationSection';
import { WeddingWishForm } from './WeddingWishForm';
import { InvitationNotice } from './InvitationNotice';
import type { CelebrationDay } from '../../utils/apiClient';
import '../../styles/wedding.css';

// What the visitor is allowed to see of the celebration schedule
export type InvitationState =
  | { status: 'none' } // No personal link (homepage)
  | { status: 'loading' }
  | { status: 'ready'; schedule: CelebrationDay[] }
  | { status: 'unavailable' } // Unknown, revoked or replaced link
  | { status: 'error' };

interface WeddingExperienceProps {
  isVisible: boolean;
  invitation: InvitationState;
}

// The date revealed under the scratch foil: the main event day when the guest
// is invited to it, otherwise the guest's first celebration day.
const getRevealDate = (schedule: CelebrationDay[]): string => {
  const day = schedule.find((d) => d.badge) || schedule[0];
  return day ? day.date : '';
};

export const WeddingExperience: React.FC<WeddingExperienceProps> = ({ isVisible, invitation }) => {
  const schedule =
    invitation.status === 'ready' && invitation.schedule.length > 0 ? invitation.schedule : null;
  const calendarEvents = schedule ? schedule.flatMap((day) => day.events) : undefined;

  return (
    <div
      className={`wedding-experience ${isVisible ? 'visible' : ''}`}
      aria-hidden={!isVisible}
    >
      <main className="wedding-content-flow">
        {/* 1. HERO SECTION */}
        <HeroSection />

        {/* 2. OUR STORY SECTION (Stitch Screen Reproduction) */}
        <OurStorySection />

        {schedule ? (
          <>
            {/* 3. SIGNATURE GOLDEN HEART SCRATCH CARD SECTION */}
            <ScratchDateSection revealDate={getRevealDate(schedule)} />

            {/* 3. SMALL WEDDING DETAILS / CELEBRATIONS BLOCK (guest's permitted events only) */}
            <WeddingDetailsBlock schedule={schedule} />
          </>
        ) : invitation.status === 'loading' ? null : (
          /* Without a valid personal invitation, no dates or events are shown */
          <InvitationNotice
            reason={
              invitation.status === 'none'
                ? 'no-link'
                : invitation.status === 'error'
                  ? 'error'
                  : 'unavailable'
            }
          />
        )}

        {/* 4. VENUE + WEDDING DATES SECTION */}
        <VenueCelebrationSection calendarEvents={calendarEvents} />

        {/* 5. SMALL WEDDING WISH FORM */}
        <WeddingWishForm />
      </main>
    </div>
  );
};
