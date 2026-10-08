import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import '../../styles/our-story.css';

export const OurStorySection: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const lineageRef = useRef<HTMLDivElement | null>(null);
  const centerpieceRef = useRef<HTMLDivElement | null>(null);
  const footnoteRef = useRef<HTMLDivElement | null>(null);
  const storyVideoRef = useRef<HTMLVideoElement | null>(null);

  // Trigger optional flower petal burst when tapping couple frame or butterflies
  const handleArtTap = () => {
    window.dispatchEvent(new CustomEvent('wedding:petal-burst'));
  };

  useEffect(() => {
    if (storyVideoRef.current) {
      storyVideoRef.current.defaultMuted = true;
      storyVideoRef.current.muted = true;
      storyVideoRef.current.play().catch(() => {
        // Autoplay policy fallback: poster remains visible
      });
    }

    const card = cardRef.current;
    if (!card) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    let hasAnimated = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;

          const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

          tl.fromTo(
            card,
            { opacity: 0, y: 36, scale: 0.985 },
            { opacity: 1, y: 0, scale: 1, duration: 1.1 }
          );

          if (headerRef.current) {
            tl.fromTo(
              headerRef.current,
              { opacity: 0, y: -16 },
              { opacity: 1, y: 0, duration: 0.8 },
              '-=0.7'
            );
          }

          if (lineageRef.current) {
            tl.fromTo(
              lineageRef.current.children,
              { opacity: 0, y: 14 },
              { opacity: 1, y: 0, duration: 0.7, stagger: 0.15 },
              '-=0.5'
            );
          }

          if (centerpieceRef.current) {
            tl.fromTo(
              centerpieceRef.current,
              { opacity: 0, scale: 0.96, y: 16 },
              { opacity: 1, scale: 1, y: 0, duration: 0.95 },
              '-=0.6'
            );
          }

          if (footnoteRef.current) {
            tl.fromTo(
              footnoteRef.current,
              { opacity: 0, y: 12 },
              { opacity: 1, y: 0, duration: 0.75 },
              '-=0.4'
            );
          }
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="our-story-wrapper">
      <section
        id="our-story"
        ref={sectionRef}
        className="our-story-card"
        aria-label="Our Story — Two Paths. One Beautiful Story"
      >
        <div ref={cardRef}>
          {/* =================================================================== */}
          {/* BACKGROUND BOTANICAL WATERCOLOR ACCENTS (Top-Left & Top-Right)      */}
          {/* =================================================================== */}
          {/* Top-Left Hand-Painted Botanical Branch (SVG) */}
          <div className="story-botanical-tl" aria-hidden="true">
            <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path
                d="M10 20C40 70 90 110 160 130C190 140 230 145 270 140"
                stroke="#7D8F76"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.65"
              />
              <path d="M40 50C70 45 95 30 110 15C85 35 65 48 40 50Z" fill="#8F9E84" fillOpacity="0.45" />
              <path d="M85 85C115 80 140 65 155 50C130 70 110 83 85 85Z" fill="#7D8F76" fillOpacity="0.5" />
              <path d="M130 115C160 110 185 95 200 80C175 100 155 113 130 115Z" fill="#8F9E84" fillOpacity="0.45" />
              {/* Watercolor Peony / Rose Bud in Soft Blush */}
              <circle cx="160" cy="130" r="28" fill="#E8B4B8" fillOpacity="0.4" />
              <circle cx="155" cy="126" r="20" fill="#D98A94" fillOpacity="0.5" />
              <circle cx="150" cy="122" r="12" fill="#C97A85" fillOpacity="0.6" />
              {/* Outer soft petals */}
              <path
                d="M140 105C150 95 170 95 180 108C190 120 185 140 170 150C155 160 135 150 130 135C125 120 130 115 140 105Z"
                fill="#F4D3D6"
                fillOpacity="0.55"
              />
              <circle cx="230" cy="140" r="16" fill="#E8B4B8" fillOpacity="0.5" />
              <circle cx="228" cy="138" r="9" fill="#C97A85" fillOpacity="0.6" />
            </svg>
          </div>

          {/* Top-Right Hand-Painted Botanical Branch with Soft Peonies */}
          <div className="story-botanical-tr" aria-hidden="true">
            <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path
                d="M290 20C260 70 210 110 140 130C110 140 70 145 30 140"
                stroke="#7D8F76"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.65"
              />
              <path d="M260 50C230 45 205 30 190 15C215 35 235 48 260 50Z" fill="#8F9E84" fillOpacity="0.45" />
              <path d="M215 85C185 80 160 65 145 50C170 70 190 83 215 85Z" fill="#7D8F76" fillOpacity="0.5" />
              <path d="M170 115C140 110 115 95 100 80C125 100 145 113 170 115Z" fill="#8F9E84" fillOpacity="0.45" />
              {/* Soft watercolor blossoms */}
              <circle cx="140" cy="130" r="30" fill="#E8B4B8" fillOpacity="0.45" />
              <circle cx="144" cy="126" r="22" fill="#D98A94" fillOpacity="0.55" />
              <circle cx="148" cy="122" r="14" fill="#C97A85" fillOpacity="0.65" />
              <circle cx="70" cy="140" r="18" fill="#F4D3D6" fillOpacity="0.6" />
              <circle cx="72" cy="138" r="10" fill="#C97A85" fillOpacity="0.55" />
            </svg>
          </div>

          {/* =================================================================== */}
          {/* PLAYFUL FLOATING BUTTERFLIES (Micro-Interactions)                   */}
          {/* =================================================================== */}
          {/* Butterfly 1 (Left Side of Image) */}
          <div
            className="story-butterfly-left"
            onClick={handleArtTap}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
            title="Tap to shower petals"
            aria-hidden="true"
          >
            <svg
              className="story-butterfly-svg-gold"
              viewBox="0 0 40 40"
              fill="currentColor"
            >
              <path
                d="M20 20C16 12 7 10 4 15C1 20 8 26 20 22C32 26 39 20 36 15C33 10 24 12 20 20Z"
                fill="#E5C378"
                fillOpacity="0.85"
              />
              <path
                d="M20 21C17 26 10 29 8 33C6 37 13 38 20 24C27 38 34 37 32 33C30 29 23 26 20 21Z"
                fill="#C5A059"
                fillOpacity="0.9"
              />
              <line x1="20" y1="16" x2="20" y2="25" stroke="#8C6D32" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Butterfly 2 (Top-Right Floating gently) */}
          <div
            className="story-butterfly-right"
            onClick={handleArtTap}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
            title="Tap to shower petals"
            aria-hidden="true"
          >
            <svg
              className="story-butterfly-svg-pink"
              viewBox="0 0 40 40"
              fill="currentColor"
            >
              <path
                d="M20 20C16 12 7 10 4 15C1 20 8 26 20 22C32 26 39 20 36 15C33 10 24 12 20 20Z"
                fill="#F4D3D6"
                fillOpacity="0.9"
              />
              <path
                d="M20 21C17 26 10 29 8 33C6 37 13 38 20 24C27 38 34 37 32 33C30 29 23 26 20 21Z"
                fill="#D98A94"
                fillOpacity="0.95"
              />
              <line x1="20" y1="16" x2="20" y2="25" stroke="#8C434E" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>

          {/* =================================================================== */}
          {/* FLOATING PETAL SHOWER PARTICLES                                     */}
          {/* =================================================================== */}
          <div className="story-petal story-petal-1" aria-hidden="true" />
          <div className="story-petal story-petal-2" aria-hidden="true" />
          <div className="story-petal story-petal-3" aria-hidden="true" />
          <div className="story-petal story-petal-4" aria-hidden="true" />

          {/* =================================================================== */}
          {/* SECTION HEADER: Royal Eyebrow, Main Couple Names & Lineage          */}
          {/* =================================================================== */}
          <div className="story-header" ref={headerRef}>
            {/* Eyebrow with Delicate Indian Botanical Motifs */}
            <div className="story-eyebrow-row">
              <span className="story-eyebrow-line-left" aria-hidden="true" />
              <span className="story-eyebrow-text">
                <svg className="story-star-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
                </svg>
                TOGETHER WITH THEIR FAMILIES
                <svg className="story-star-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
                </svg>
              </span>
              <span className="story-eyebrow-line-right" aria-hidden="true" />
            </div>

            {/* Main Heading: High-Contrast Royal Serif */}
            <h2 className="story-couple-heading">
              Manya <span className="story-script-amp">&amp;</span> Sarthak
            </h2>

            {/* Family Lineage Columns */}
            <div className="story-lineage-container">
              <div className="story-lineage-grid" ref={lineageRef}>
                {/* Manya's Family Lineage */}
                <div className="story-lineage-left">
                  <div className="story-lineage-stack">
                    <div>
                      <span className="story-lineage-role">Daughter of</span>
                      <p className="story-lineage-parents">
                        Mr. Satish Gandhi
                        <br />
                        Smt. Kavita Gandhi
                      </p>
                    </div>
                    <div className="story-lineage-grandparents-block">
                      <span className="story-lineage-role">Granddaughter of</span>
                      <p className="story-lineage-grandparents">
                        Late Shri Om Prakash Gandhi
                        <br />
                        Late Smt. Saroj Gandhi
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sarthak's Family Lineage */}
                <div className="story-lineage-right">
                  <div className="story-lineage-stack">
                    <div>
                      <span className="story-lineage-role">Son of</span>
                      <p className="story-lineage-parents">
                        Mr. Pardeep Kumar Sharma
                        <br />
                        Smt. Tanuja Sharma
                      </p>
                    </div>
                    <div className="story-lineage-grandparents-block">
                      <span className="story-lineage-role">Grandson of</span>
                      <p className="story-lineage-grandparents">
                        Late Shri Kailash Chandra Sharma
                        <br />
                        Smt. Kanta Sharma
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* DOMINANT CENTERPIECE: The Large Romantic Couple Scene Artwork       */}
          {/* =================================================================== */}
          <div className="story-centerpiece" ref={centerpieceRef}>
            {/* Outer Heirloom Handcrafted Arch Frame */}
            <div
              className="story-album-frame"
              onClick={handleArtTap}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleArtTap();
              }}
              aria-label="Couple portrait — Tap to shower petals"
            >
              {/* Four Corner Gold Filigree Accents (Stationery Heritage Detail) */}
              <div className="story-filigree-corner story-filigree-tl" aria-hidden="true">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M2 2H20C20 12 12 20 2 20V2Z" fill="currentColor" fillOpacity="0.25" />
                  <path d="M2 2C10 2 22 14 22 22" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="6" cy="6" r="2.5" fill="currentColor" />
                </svg>
              </div>
              <div className="story-filigree-corner story-filigree-tr" aria-hidden="true">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M2 2H20C20 12 12 20 2 20V2Z" fill="currentColor" fillOpacity="0.25" />
                  <path d="M2 2C10 2 22 14 22 22" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="6" cy="6" r="2.5" fill="currentColor" />
                </svg>
              </div>
              <div className="story-filigree-corner story-filigree-bl" aria-hidden="true">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M2 2H20C20 12 12 20 2 20V2Z" fill="currentColor" fillOpacity="0.25" />
                  <path d="M2 2C10 2 22 14 22 22" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="6" cy="6" r="2.5" fill="currentColor" />
                </svg>
              </div>
              <div className="story-filigree-corner story-filigree-br" aria-hidden="true">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M2 2H20C20 12 12 20 2 20V2Z" fill="currentColor" fillOpacity="0.25" />
                  <path d="M2 2C10 2 22 14 22 22" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="6" cy="6" r="2.5" fill="currentColor" />
                </svg>
              </div>

              {/* Subtle Inner Embossed Inset Border */}
              <div className="story-inner-border">
                {/* Image Container with Scalloped Arched Composition */}
                <div className="story-image-canvas">
                  {/* Bespoke Couple Video */}
                  <video
                    ref={storyVideoRef}
                    src="/videos/hero-wedding.mp4"
                    poster="/images/our-story-couple.webp"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="story-couple-photo story-couple-video"
                    aria-hidden="true"
                  >
                    <source src="/videos/hero-wedding.mp4" type="video/mp4" />
                  </video>

                  {/* Inset Ring Hairline */}
                  <div className="story-ring-overlay" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* POETIC MICRO-JOURNEY FOOTNOTE                                       */}
          {/* =================================================================== */}
          <div className="story-footnote" ref={footnoteRef}>
            {/* Decorative Gilded Divider */}
            <div className="story-footnote-divider">
              <span className="story-footnote-line-left" aria-hidden="true" />
              <svg className="story-heart-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="story-footnote-line-right" aria-hidden="true" />
            </div>

            <p className="story-signoff-text">
              Held by love • Blessed by family • Cherished forever
            </p>

            {/* Organic Petal Transition to the Next Ceremonial Section */}
            <div className="story-dots-row" aria-hidden="true">
              <span className="story-dot-rose" />
              <span className="story-dot-gold" />
              <span className="story-dot-sage" />
            </div>
          </div>

          {/* Bottom Watercolor Botanical Vines Connecting Sections */}
          <div className="story-botanical-bottom" aria-hidden="true">
            <svg viewBox="0 0 400 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path
                d="M10 30C80 45 150 15 200 30C250 45 320 15 390 30"
                stroke="#7D8F76"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path d="M120 24C140 18 150 10 160 5C145 18 135 24 120 24Z" fill="#8F9E84" fillOpacity="0.5" />
              <path d="M240 36C260 42 270 50 280 55C265 42 255 36 240 36Z" fill="#7D8F76" fillOpacity="0.5" />
              <circle cx="200" cy="30" r="8" fill="#E8B4B8" fillOpacity="0.5" />
              <circle cx="199" cy="29" r="4" fill="#C97A85" fillOpacity="0.6" />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OurStorySection;
