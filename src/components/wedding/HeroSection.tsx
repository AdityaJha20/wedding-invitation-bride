import React from 'react';

export const HeroSection: React.FC = () => {
  const triggerPetalShower = () => {
    window.dispatchEvent(new CustomEvent('wedding:petal-burst'));
  };

  const scrollToScratch = (e: React.MouseEvent) => {
    e.preventDefault();
    const elem = document.getElementById('scratch-card');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-section" aria-label="Wedding Invitation Hero">
      {/* Soft romantic ambient glow aura */}
      <div className="hero-glow hero-glow-1" aria-hidden="true" />
      <div className="hero-glow hero-glow-2" aria-hidden="true" />

      {/* Heirloom Stationery Folio Card */}
      <div className="folio-card">
        {/* Inner Gold Inset Emboss Lines */}
        <div className="folio-embossed-border" aria-hidden="true" />

        <div className="folio-content">
          {/* 1. Auspicious Mangal Shlok & Floral Bells */}
          <div className="auspicious-greeting-row">
            <span className="gold-hairline-rule rule-left" aria-hidden="true" />
            <span className="material-symbols-outlined auspicious-icon">spa</span>
            <span className="auspicious-shlok">|| श्री गणेशाय नमः ||</span>
            <span className="material-symbols-outlined auspicious-icon">spa</span>
            <span className="gold-hairline-rule rule-right" aria-hidden="true" />
          </div>

          {/* 2. Welcoming Romantic Quote */}
          <p className="hero-quote">
            “Together with our families, we joyfully invite you to celebrate this beautiful beginning”
          </p>

          {/* 3. TOP CENTER: ROYAL ORNATE MS CREST (Single ornate crest with no circular ring) */}
          <div
            className="hero-crest-container"
            onClick={triggerPetalShower}
            role="button"
            tabIndex={0}
            aria-label="Royal Ornate MS Monogram Crest — Tap to shower petals"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') triggerPetalShower();
            }}
          >
            <img
              src="/images/ms-hero-crest-transparent.png"
              alt="Royal Ornate MS Monogram Crest"
              className="hero-crest-img"
              loading="eager"
            />
          </div>

          {/* 4. LUXURY COUPLE NAMES */}
          <h1 className="couple-names-headline">
            Manya <span className="weds-accent">Weds</span> Sarthak
          </h1>

          {/* 5. WEDDING SUBTITLE */}
          <p className="wedding-subtitle">
            The Wedding of Two Hearts
          </p>

          {/* 6. COUPLE ARTWORK WITH MOBILE-SAFE REFLOW */}
          <div className="couple-artwork-frame">
            <img
              src="/images/cinematic_3d_animation_couple_portrait_of_manya_and_sarthak_in_traditional.png"
              alt="Manya and Sarthak in traditional wedding attire looking joyfully up towards their wedding crest"
              className="couple-artwork-img"
              loading="eager"
            />
            <div className="couple-artwork-overlay">
              <div className="overlay-text-col">
                <span className="union-badge">Auspicious Sacred Union</span>
                <p className="overlay-quote">
                  “A love story nurtured by laughter, family love, and endless chai dates.”
                </p>
              </div>
              <button
                type="button"
                className="shower-petals-btn"
                onClick={triggerPetalShower}
                aria-label="Shower flower petals"
              >
                <span className="material-symbols-outlined shower-icon">favorite</span>
                <span>Shower Petals</span>
              </button>
            </div>
          </div>

          {/* 7. QUICK NAVIGATION CTA GROUP */}
          <div className="hero-cta-group">
            <a
              href="#scratch-card"
              onClick={scrollToScratch}
              className="hero-primary-cta"
            >
              <span className="material-symbols-outlined cta-icon">lock_open</span>
              <span>Reveal The Wedding Date</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
