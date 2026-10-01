import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import '../../styles/opening.css';

gsap.registerPlugin(useGSAP);

export interface OpeningSplitSceneProps {
  onOpenComplete?: () => void;
}

/**
 * StationerySurface:
 * Shared 100vw x 100vh physical luxury stationery surface.
 * Recreates the exact material language of the bridal lace reference:
 * - Warm ivory / soft white paper
 * - Real raised white embroidery / lace appliqué with dimensional petals and pearls along perimeters
 * - Clean, calm, open center allowing the MS wax seal to remain the focal point
 * - Subtle ivory debossed border framing
 * - Fine organic paper grain
 * Rendered identically in both Top and Bottom panels to guarantee seamless continuity.
 */
const StationerySurface: React.FC = () => {
  return (
    <div className="stationery-canvas-inner" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Luxury fine paper grain overlay */}
      <div className="paper-grain-overlay" />

      {/* Soft directional lighting vignette */}
      <div className="paper-lighting-overlay" />

      {/* Subtle raised ivory debossed frame */}
      <div className="stationery-frame" />
    </div>
  );
};

export const OpeningSplitScene: React.FC<OpeningSplitSceneProps> = ({ onOpenComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isOpeningRef = useRef(false);

  const sceneRef = useRef<HTMLDivElement>(null);
  const topPanelRef = useRef<HTMLDivElement>(null);
  const bottomPanelRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLButtonElement>(null);
  const topEdgeRef = useRef<HTMLDivElement>(null);
  const bottomEdgeRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP({ scope: sceneRef });

  const handleSealClick = contextSafe(() => {
    // Guard against repeated activations
    if (isOpeningRef.current || isOpen) return;
    isOpeningRef.current = true;

    // Single deterministic GSAP timeline (LOCKED - APPROVED OPENING ANIMATION)
    const tl = gsap.timeline({
      onComplete: () => {
        setIsOpen(true);
        onOpenComplete?.();
      },
    });

    // Phase 1: Tactile Seal Compression (0.00 – 0.15s)
    // Physical feeling of pressing into the wax seal
    tl.to(sealRef.current, {
      scale: 0.96,
      duration: 0.15,
      ease: 'power1.inOut',
    });

    // Phase 2: Seal Release (0.15 – 0.30s)
    // Subtle physical release/lift unlocking the two stationery halves
    tl.to(sealRef.current, {
      scale: 1.0,
      duration: 0.15,
      ease: 'power1.out',
    });

    // Phase 3: Symmetrical Split Motion (0.30 – 1.10s, ~800ms)
    // TOP PANEL -> UPWARD (yPercent: -100)
    // BOTTOM PANEL -> DOWNWARD (yPercent: 100)
    // Both move simultaneously with zero rotation or distortion
    tl.to(
      topPanelRef.current,
      {
        yPercent: -100,
        duration: 0.8,
        ease: 'power2.inOut',
      },
      'split'
    )
      .to(
        bottomPanelRef.current,
        {
          yPercent: 100,
          duration: 0.8,
          ease: 'power2.inOut',
        },
        'split'
      )
      // Edge shadows emerge dynamically at separation boundary
      .to(
        topEdgeRef.current,
        {
          opacity: 1,
          duration: 0.25,
          ease: 'power1.out',
        },
        'split'
      )
      .to(
        bottomEdgeRef.current,
        {
          opacity: 1,
          duration: 0.25,
          ease: 'power1.out',
        },
        'split'
      )
      // The seal dissolves smoothly during the separation, completely clearing the center
      .to(
        sealRef.current,
        {
          opacity: 0,
          scale: 1.04,
          duration: 0.45,
          ease: 'power2.out',
        },
        'split+=0.05'
      );
  });

  return (
    <div
      ref={sceneRef}
      className={`opening-split-root ${isOpen ? 'is-open' : ''}`}
      aria-hidden={isOpen}
    >
      {/* --------------------------------------------------------------------
         TOP PANEL: 50vh, top: 0, moves UPWARD
         Houses upper half of the shared stationery canvas (top: 0)
         -------------------------------------------------------------------- */}
      <div ref={topPanelRef} className="panel panel-top">
        <div className="stationery-canvas stationery-canvas-top">
          <StationerySurface />
        </div>
        {/* Dynamic parting edge shadow */}
        <div ref={topEdgeRef} className="seam-edge seam-edge-bottom" />
      </div>

      {/* --------------------------------------------------------------------
         BOTTOM PANEL: 50vh, top: 50vh, moves DOWNWARD
         Houses lower half of the shared stationery canvas (top: -50vh)
         -------------------------------------------------------------------- */}
      <div ref={bottomPanelRef} className="panel panel-bottom">
        <div className="stationery-canvas stationery-canvas-bottom">
          <StationerySurface />
        </div>
        {/* Dynamic parting edge shadow */}
        <div ref={bottomEdgeRef} className="seam-edge seam-edge-top" />
      </div>

      {/* --------------------------------------------------------------------
         MS WAX SEAL: Exactly centered over the center seam (50%, 50%)
         Overlaps both panels equally.
         Semantic button with accessible label.
         -------------------------------------------------------------------- */}
      <div className="wax-seal-wrapper">
        <button
          ref={sealRef}
          type="button"
          className="wax-seal-button"
          aria-label="Open wedding invitation"
          onClick={handleSealClick}
          disabled={isOpen}
        >
          <div className="wax-seal-frame">
            <img
              src="/images/ms-wax-seal.png"
              alt="SM Wax Seal Stamp"
              className="wax-seal-image"
              draggable={false}
            />
            <span className="wax-seal-prompt">
              <svg
                className="wax-seal-prompt-heart"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="wax-seal-prompt-text">TAP TO OPEN</span>
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
