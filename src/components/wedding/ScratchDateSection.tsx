import React, { useRef, useEffect, useState, useCallback } from 'react';

// Exact SVG Path of the heart matching the objectBoundingBox clip-path
const HEART_CLIP_PATH =
  'M 0.5,0.9655 C 0.5,0.9655 0.0625,0.6379 0.0625,0.3621 C 0.0625,0.1379 0.2188,0.0517 0.3688,0.0517 C 0.4531,0.0517 0.4938,0.1207 0.5,0.1552 C 0.5063,0.1207 0.5469,0.0517 0.6313,0.0517 C 0.7813,0.0517 0.9375,0.1379 0.9375,0.3621 C 0.9375,0.6379 0.5,0.9655 0.5,0.9655 Z';

// Champagne and golden-white celebration color palette
const CHAMPAGNE_COLORS = [
  '#F5E3A9', // Light Champagne
  '#E8C87A', // Warm Gold
  '#D4AF37', // Classic Wedding Gold
  '#FFFDF5', // Golden White Starlight
  '#F9E9BA', // Pale Cream Gold
  '#F2D4B7', // Soft Champagne Rose
];

// Precomputes sample points located strictly within the actual heart scratchable area
const computeHeartSamplePoints = (w: number, h: number): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  try {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w;
    offCanvas.height = h;
    const offCtx = offCanvas.getContext('2d');
    if (offCtx && typeof Path2D !== 'undefined') {
      offCtx.save();
      offCtx.scale(w, h);
      offCtx.fill(new Path2D(HEART_CLIP_PATH));
      offCtx.restore();
      const maskData = offCtx.getImageData(0, 0, w, h).data;
      const steps = 18;
      const stepX = w / steps;
      const stepY = h / steps;
      for (let gy = 1; gy < steps; gy++) {
        for (let gx = 1; gx < steps; gx++) {
          const px = Math.floor(gx * stepX);
          const py = Math.floor(gy * stepY);
          const idx = (py * w + px) * 4 + 3;
          if (maskData[idx] > 140) {
            points.push({ x: px, y: py });
          }
        }
      }
    }
  } catch {
    // Canvas context error fallback
  }

  // Robust analytical fallback if offscreen canvas or Path2D failed
  if (points.length === 0) {
    const steps = 18;
    for (let gy = 1; gy < steps; gy++) {
      for (let gx = 1; gx < steps; gx++) {
        const nx = gx / steps;
        const ny = gy / steps;
        const x = Math.abs(nx - 0.5) * 2;
        let inside = false;
        if (ny >= 0.05 && ny <= 0.96) {
          if (ny < 0.16 && x < 0.18) {
            inside = false;
          } else if (ny < 0.36) {
            const dx = x - 0.36;
            const dy = ny - 0.20;
            inside = (dx * dx) / (0.46 * 0.46) + (dy * dy) / (0.17 * 0.17) <= 1.05;
          } else {
            const allowedW = 0.94 * (1.0 - Math.pow((ny - 0.36) / 0.60, 0.88));
            inside = x <= allowedW;
          }
        }
        if (inside) {
          points.push({ x: Math.floor(nx * w), y: Math.floor(ny * h) });
        }
      }
    }
  }
  return points;
};

// "24 NOVEMBER 2026" -> "24 November 2026" for the celebration banner
const toTitleCaseDate = (date: string): string =>
  date
    .split(' ')
    .map((word) => (word ? word.charAt(0) + word.slice(1).toLowerCase() : word))
    .join(' ');

interface ScratchDateSectionProps {
  // Date revealed under the foil, taken from the guest's own celebration days
  revealDate: string;
}

export const ScratchDateSection: React.FC<ScratchDateSectionProps> = ({ revealDate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heartFrameRef = useRef<HTMLDivElement | null>(null);
  const fireworksCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isRevealed, setIsRevealed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const isDrawingRef = useRef(false);
  const scratchedCountRef = useRef(0);
  const revealedRef = useRef(false);
  const fireworksTriggeredRef = useRef(false);
  const animIdRef = useRef<number | null>(null);
  const heartSamplePointsRef = useRef<{ x: number; y: number }[]>([]);

  const lastScratchCoordRef = useRef<{ x: number; y: number } | null>(null);
  const lastPetalCoordRef = useRef<{ x: number; y: number } | null>(null);
  const accumulatedDistRef = useRef(0);
  const lastPetalTimeRef = useRef(0);

  const drawGoldFoil = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    // Luxurious Champagne Gold Foil Gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#C5A059');
    grad.addColorStop(0.25, '#F5E3A9');
    grad.addColorStop(0.5, '#AA7C11');
    grad.addColorStop(0.75, '#F9E9BA');
    grad.addColorStop(1, '#B38B38');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Gold Shimmer Flecks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    for (let i = 0; i < 65; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Elegant Foil Text Stamp positioned in optical sweet spot of the heart
    const titleSize = Math.max(10, Math.min(13, Math.round(canvas.width * 0.038)));
    const subSize = Math.max(9, Math.min(11, Math.round(canvas.width * 0.032)));

    ctx.fillStyle = '#4E3700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${titleSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('SCRATCH OUR SECRET', canvas.width / 2, canvas.height * 0.44);
    ctx.font = `italic ${subSize}px "Playfair Display", Georgia, serif`;
    ctx.fillText('✨ to unveil auspicious date ✨', canvas.width / 2, canvas.height * 0.44 + 20);
  }, []);

  // Small, subtle celebratory fireworks effect in warm champagne/golden-white
  const triggerCelebrationFireworks = useCallback(() => {
    if (fireworksTriggeredRef.current) return;
    fireworksTriggeredRef.current = true;

    const fwCanvas = fireworksCanvasRef.current;
    const mountCard = containerRef.current;
    const heartFrame = heartFrameRef.current;
    if (!fwCanvas || !mountCard) return;

    const rect = mountCard.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    fwCanvas.width = Math.round(rect.width * dpr);
    fwCanvas.height = Math.round(rect.height * dpr);

    const ctx = fwCanvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Compute optical burst origins at upper shoulders of the heart (never obstructs central date)
    let originLeft = { x: rect.width * 0.36, y: rect.height * 0.28 };
    let originRight = { x: rect.width * 0.64, y: rect.height * 0.28 };
    let originCenter = { x: rect.width * 0.5, y: rect.height * 0.16 };

    if (heartFrame) {
      const heartRect = heartFrame.getBoundingClientRect();
      const hCenterX = heartRect.left - rect.left + heartRect.width * 0.5;
      const hTop = heartRect.top - rect.top;
      const hWidth = heartRect.width;
      const hHeight = heartRect.height;

      originLeft = { x: hCenterX - hWidth * 0.22, y: hTop + hHeight * 0.20 };
      originRight = { x: hCenterX + hWidth * 0.22, y: hTop + hHeight * 0.20 };
      originCenter = { x: hCenterX, y: hTop + hHeight * 0.10 };
    }

    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      alpha: number;
      decay: number;
      twinklePhase: number;
      twinkleSpeed: number;
      trail: { x: number; y: number }[];
    }

    interface LightFlash {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
      decay: number;
    }

    const sparks: Spark[] = [];
    const flashes: LightFlash[] = [
      { x: originLeft.x, y: originLeft.y, radius: 4, maxRadius: 26, alpha: 0.28, decay: 0.024 },
      { x: originRight.x, y: originRight.y, radius: 4, maxRadius: 26, alpha: 0.28, decay: 0.024 },
      { x: originCenter.x, y: originCenter.y, radius: 3, maxRadius: 20, alpha: 0.22, decay: 0.022 },
    ];

    // Left shoulder burst: 14 delicate sparks arching upward & outward to the left
    for (let i = 0; i < 14; i++) {
      const angle = -Math.PI * 0.5 - (0.15 + Math.random() * 0.65);
      const speed = 1.6 + Math.random() * 2.2;
      sparks.push({
        x: originLeft.x,
        y: originLeft.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: CHAMPAGNE_COLORS[Math.floor(Math.random() * CHAMPAGNE_COLORS.length)],
        size: 1.2 + Math.random() * 1.3,
        alpha: 0.95 + Math.random() * 0.05,
        decay: 0.016 + Math.random() * 0.010,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.18 + Math.random() * 0.20,
        trail: [],
      });
    }

    // Right shoulder burst: 14 delicate sparks arching upward & outward to the right
    for (let i = 0; i < 14; i++) {
      const angle = -Math.PI * 0.5 + (0.15 + Math.random() * 0.65);
      const speed = 1.6 + Math.random() * 2.2;
      sparks.push({
        x: originRight.x,
        y: originRight.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: CHAMPAGNE_COLORS[Math.floor(Math.random() * CHAMPAGNE_COLORS.length)],
        size: 1.2 + Math.random() * 1.3,
        alpha: 0.95 + Math.random() * 0.05,
        decay: 0.016 + Math.random() * 0.010,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.18 + Math.random() * 0.20,
        trail: [],
      });
    }

    // Center crest burst: 10 delicate fountain sparks floating upward
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() * 0.5 - 0.25);
      const speed = 1.4 + Math.random() * 1.8;
      sparks.push({
        x: originCenter.x,
        y: originCenter.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: CHAMPAGNE_COLORS[Math.floor(Math.random() * CHAMPAGNE_COLORS.length)],
        size: 1.1 + Math.random() * 1.2,
        alpha: 0.92 + Math.random() * 0.08,
        decay: 0.018 + Math.random() * 0.010,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.20 + Math.random() * 0.20,
        trail: [],
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      let hasActiveElements = false;

      // Soft champagne light flashes
      for (const flash of flashes) {
        if (flash.alpha > 0) {
          hasActiveElements = true;
          const grad = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, flash.radius);
          grad.addColorStop(0, `rgba(255, 248, 220, ${flash.alpha})`);
          grad.addColorStop(0.5, `rgba(245, 227, 169, ${flash.alpha * 0.5})`);
          grad.addColorStop(1, 'rgba(245, 227, 169, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
          ctx.fill();

          flash.radius += (flash.maxRadius - flash.radius) * 0.22;
          flash.alpha -= flash.decay;
        }
      }

      // Spark particles
      for (const s of sparks) {
        if (s.alpha > 0) {
          hasActiveElements = true;

          // Trail
          if (s.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(s.trail[0].x, s.trail[0].y);
            for (let t = 1; t < s.trail.length; t++) {
              ctx.lineTo(s.trail[t].x, s.trail[t].y);
            }
            ctx.strokeStyle = s.color;
            ctx.lineWidth = Math.max(0.6, s.size * 0.6);
            ctx.globalAlpha = Math.max(0, s.alpha * 0.32);
            ctx.stroke();
          }

          // Twinkle shimmer
          s.twinklePhase += s.twinkleSpeed;
          const shimmer = 0.8 + 0.25 * Math.sin(s.twinklePhase);
          const drawAlpha = Math.max(0, Math.min(1, s.alpha * shimmer));

          // Core spark dot
          ctx.globalAlpha = drawAlpha;
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();

          // Soft micro-glint star on brighter sparks
          if (s.size > 1.6 && drawAlpha > 0.45) {
            ctx.strokeStyle = 'rgba(255, 255, 255, ' + (drawAlpha * 0.6) + ')';
            ctx.lineWidth = 0.7;
            const glint = s.size * 1.6;
            ctx.beginPath();
            ctx.moveTo(s.x - glint, s.y);
            ctx.lineTo(s.x + glint, s.y);
            ctx.moveTo(s.x, s.y - glint);
            ctx.lineTo(s.x, s.y + glint);
            ctx.stroke();
          }

          // History trail
          s.trail.push({ x: s.x, y: s.y });
          if (s.trail.length > 4) {
            s.trail.shift();
          }

          // Physics update
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= 0.94;
          s.vy *= 0.94;
          s.vy += 0.034;
          s.alpha -= s.decay;
        }
      }

      ctx.globalAlpha = 1;

      if (hasActiveElements) {
        animIdRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
        animIdRef.current = null;
      }
    };

    animIdRef.current = requestAnimationFrame(animate);
  }, []);

  const triggerReveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setIsRevealed(true);
    setShowCelebration(true);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.opacity = '0';
      setTimeout(() => {
        canvas.style.display = 'none';
      }, 700);
    }

    // Trigger subtle celebratory fireworks effect once on completion
    triggerCelebrationFireworks();

    // Additive festive petal flourish on completion
    window.dispatchEvent(new CustomEvent('wedding:petal-burst'));
  }, [triggerCelebrationFireworks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const setupCanvas = () => {
      if (revealedRef.current) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
      drawGoldFoil(canvas, ctx);

      // Dynamically compute sample points within actual heart scratchable area for this screen size
      heartSamplePointsRef.current = computeHeartSamplePoints(canvas.width, canvas.height);
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    const scratch = (clientX: number, clientY: number) => {
      if (!isDrawingRef.current || revealedRef.current) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Coordinate mapping accounting for exact canvas scaling
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      // Tactile physical scratch radius adapted to heart size
      const radius = Math.max(18, Math.min(26, canvas.width * 0.075));

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.lineWidth = radius * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (lastScratchCoordRef.current) {
        ctx.moveTo(lastScratchCoordRef.current.x, lastScratchCoordRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      lastScratchCoordRef.current = { x, y };

      // Meaningful scratch petal trigger: rose petals per intentional stroke
      if (lastPetalCoordRef.current) {
        const dx = clientX - lastPetalCoordRef.current.x;
        const dy = clientY - lastPetalCoordRef.current.y;
        const dist = Math.hypot(dx, dy);
        accumulatedDistRef.current += dist;
      }
      lastPetalCoordRef.current = { x: clientX, y: clientY };

      const now = performance.now();
      if (accumulatedDistRef.current >= 45 && now - lastPetalTimeRef.current >= 380) {
        window.dispatchEvent(
          new CustomEvent('wedding:scratch-petals', {
            detail: { x: clientX, y: clientY },
          })
        );
        accumulatedDistRef.current = 0;
        lastPetalTimeRef.current = now;
      }

      scratchedCountRef.current++;

      // Strict reveal threshold: ~65% clearance of actual scratchable area of the heart (increased by 30%)
      if (scratchedCountRef.current >= 24 && scratchedCountRef.current % 4 === 0) {
        try {
          const samplePoints = heartSamplePointsRef.current;
          if (samplePoints.length > 0) {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imgData.data;
            let clearedCount = 0;
            const totalSamples = samplePoints.length;

            for (let i = 0; i < totalSamples; i++) {
              const pt = samplePoints[i];
              const idx = (pt.y * canvas.width + pt.x) * 4 + 3;
              if (idx < pixels.length && pixels[idx] < 60) {
                clearedCount++;
              }
            }

            const clearedRatio = clearedCount / totalSamples;
            // Strict 65% reveal threshold: will not reveal prematurely at 50%
            if (clearedRatio >= 0.65 && !revealedRef.current) {
              triggerReveal();
            }
          }
        } catch {
          // Graceful fallback for restricted canvas environments (increased by 30% to 65 strokes)
          if (scratchedCountRef.current >= 65 && !revealedRef.current) {
            triggerReveal();
          }
        }
      }
    };

    // Mouse handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDrawingRef.current = true;
      lastScratchCoordRef.current = null;
      lastPetalCoordRef.current = { x: e.clientX, y: e.clientY };
      scratch(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      scratch(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      isDrawingRef.current = false;
      lastScratchCoordRef.current = null;
      lastPetalCoordRef.current = null;
    };

    // Touch handlers with e.preventDefault() to guarantee NO accidental page scrolling
    const handleTouchStart = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      isDrawingRef.current = true;
      lastScratchCoordRef.current = null;
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        lastPetalCoordRef.current = { x: touch.clientX, y: touch.clientY };
        scratch(touch.clientX, touch.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (e.touches.length > 0) {
        scratch(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      isDrawingRef.current = false;
      lastScratchCoordRef.current = null;
      lastPetalCoordRef.current = null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Non-passive touch listener prevents viewport scroll during active scratch
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
      window.removeEventListener('resize', setupCanvas);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [drawGoldFoil, triggerReveal]);

  return (
    <section className="scratch-section" id="scratch-card" aria-label="Wedding Date Scratch Card">
      {/* Hidden SVG defining responsive normalized heart clip-path */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          <clipPath id="wedding-heart-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0.5,0.9655 C 0.5,0.9655 0.0625,0.6379 0.0625,0.3621 C 0.0625,0.1379 0.2188,0.0517 0.3688,0.0517 C 0.4531,0.0517 0.4938,0.1207 0.5,0.1552 C 0.5063,0.1207 0.5469,0.0517 0.6313,0.0517 C 0.7813,0.0517 0.9375,0.1379 0.9375,0.3621 C 0.9375,0.6379 0.5,0.9655 0.5,0.9655 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className="scratch-inner-container">
        {/* Header badge */}
        <div className="scratch-header-badge">
          <span className="material-symbols-outlined badge-heart-icon">favorite</span>
          <span className="badge-text">Our Auspicious Muhurat</span>
        </div>

        <h2 className="scratch-heading">Scratch Our Little Secret</h2>
        <p className="scratch-subheading">
          Rub with your finger or cursor over the golden heart to reveal the sacred wedding date!
        </p>

        {/* Golden Heart Mount Container */}
        <div className="scratch-mount-card" ref={containerRef}>
          {/* Celebratory Fireworks Canvas Overlay */}
          <canvas
            ref={fireworksCanvasRef}
            className="scratch-fireworks-canvas"
            aria-hidden="true"
          />

          {/* Heart Shape Interactive Wrapper */}
          <div className="heart-interactive-frame" ref={heartFrameRef}>
            {/* UNDERNEATH REVEALED CONTENT - Fixed in place beneath scratch canvas */}
            <div className="heart-revealed-content">
              <div className="calendar-icon-disc">
                <span className="material-symbols-outlined calendar-glyph">calendar_month</span>
              </div>
              <span className="revealed-save-date">Save The Date</span>
              <h3 className="revealed-wedding-date">{revealDate}</h3>
            </div>

            {/* INTERACTIVE CANVAS OVERLAY FOR SCRATCHING */}
            <canvas
              ref={canvasRef}
              className={`heart-scratch-canvas ${isRevealed ? 'revealed' : ''}`}
              aria-label="Golden heart scratch foil surface"
            />
          </div>

          {/* Bottom Action Prompt & Quick Reveal Button */}
          <div className="scratch-action-bar">
            <div className="scratch-hint">
              <span className="material-symbols-outlined hint-icon">gesture</span>
              <span>Gently rub heart surface</span>
            </div>

            {!isRevealed && (
              <button
                type="button"
                className="quick-reveal-btn"
                onClick={triggerReveal}
                aria-label="Tap to reveal wedding date"
              >
                <span className="material-symbols-outlined reveal-btn-icon">magic_button</span>
                <span>Tap to Reveal Date</span>
              </button>
            )}
          </div>

          {/* Joyful Celebration Banner upon Reveal */}
          {showCelebration && (
            <div className="scratch-celebration-banner" role="status" aria-live="polite">
              🌸 Mark your calendars for {toTitleCaseDate(revealDate)}! We cannot wait to celebrate together! 🌸
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
