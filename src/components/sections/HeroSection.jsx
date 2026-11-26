'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ── Crypto ticker data ─────────────────────────────────────────
const cryptoTicker = [
  { symbol: 'BTC', name: 'Bitcoin',  price: '$63,248.50', change: '+2.4%',  up: true  },
  { symbol: 'ETH', name: 'Ethereum', price: '$3,481.20',  change: '+1.8%',  up: true  },
  { symbol: 'SOL', name: 'Solana',   price: '$148.90',    change: '-0.6%',  up: false },
  { symbol: 'BNB', name: 'BNB',      price: '$412.30',    change: '+3.1%',  up: true  },
  { symbol: 'XRP', name: 'Ripple',   price: '$0.5821',    change: '-1.2%',  up: false },
  { symbol: 'ADA', name: 'Cardano',  price: '$0.4523',    change: '+0.9%',  up: true  },
  { symbol: 'DOT', name: 'Polkadot', price: '$7.234',     change: '+2.1%',  up: true  },
  { symbol: 'LTC', name: 'Litecoin', price: '$82.15',     change: '-0.4%',  up: false },
  { symbol: 'USDT', name: 'Tether',  price: '$1.0001',    change: '+0.0%',  up: true  },
  { symbol: 'MATIC', name: 'Polygon', price: '$0.8821',   change: '+4.2%',  up: true  },
];

// Coin icon colors
const coinColors = {
  BTC:   '#f7931a',
  ETH:   '#627eea',
  SOL:   '#9945ff',
  BNB:   '#f3ba2f',
  XRP:   '#346aa9',
  ADA:   '#0033ad',
  DOT:   '#e6007a',
  LTC:   '#bfbbbb',
  USDT:  '#26a17b',
  MATIC: '#8247e5',
};

const coinIcons = {
  BTC:   'fab fa-bitcoin',
  ETH:   'fab fa-ethereum',
  SOL:   'fas fa-sun',
  BNB:   'fas fa-coins',
  XRP:   'fas fa-water',
  ADA:   'fas fa-circle',
  DOT:   'fas fa-dot-circle',
  LTC:   'fas fa-coins',
  USDT:  'fas fa-dollar-sign',
  MATIC: 'fas fa-gem',
};

// Bullet points
const bulletPoints = [
  'Fast Account Opening and Management.',
  'Secure & Transparent Investments.',
  'Wide Range of Investment Plans.',
  'Daily Returns & Profit Tracking.',
  'Advanced Portfolio Management.',
];

export default function HeroSection() {
  const sectionRef   = useRef(null);
  const tickerBarRef = useRef(null);
  const tickerRef    = useRef(null);
  const badgeRef     = useRef(null);
  const headlineRef  = useRef(null);
  const bulletsRef   = useRef(null);
  const ctaRef       = useRef(null);
  const marqueeRef   = useRef(null);
  const bgWrapRef    = useRef(null);
  const bgFloatRef   = useRef(null);
  const bgImgRef     = useRef(null);
  const ambientRef   = useRef(null);
  const copyRef      = useRef(null);

  // ── Ticker infinite scroll ─────────────────────────────────
  useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;

    const ticker = tickerRef.current;

    const clone = marquee.cloneNode(true);
    ticker.appendChild(clone);

    const anim = gsap.to(ticker, {
      x: () => -marquee.offsetWidth,
      duration: 35,
      ease: 'none',
      repeat: -1,
    });

    // Pause on hover
    const pause = () => anim.pause();
    const resume = () => anim.resume();

    ticker.parentElement.addEventListener('mouseenter', pause);
    ticker.parentElement.addEventListener('mouseleave', resume);

    return () => {
      anim.kill();
      clone.remove();
      ticker.parentElement.removeEventListener('mouseenter', pause);
      ticker.parentElement.removeEventListener('mouseleave', resume);
    };
  }, []);

  // ── Entry animations ───────────────────────────────────────
  useGSAP(() => {
    console.log('[HeroSection] entrance timeline building…');
    const tl = gsap.timeline({ delay: 0.15, defaults: { ease: 'power4.out' } });

    // Ticker bar glides down first, setting the pace for everything else
    tl.fromTo(tickerBarRef.current,
      { y: -22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7 }
    );

    tl.fromTo(badgeRef.current,
      { y: 18, opacity: 0, filter: 'blur(6px)' },
      { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7 },
      '-=0.35'
    );

    tl.fromTo(headlineRef.current.querySelectorAll('.hero-line'),
      { y: 46, opacity: 0, filter: 'blur(9px)' },
      { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, stagger: 0.14 },
      '-=0.3'
    );

    tl.fromTo(bulletsRef.current.querySelectorAll('.bullet-item'),
      { x: -24, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.55, stagger: 0.09, ease: 'power2.out' },
      '-=0.45'
    );

    tl.fromTo(ctaRef.current.querySelectorAll('a'),
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.12, ease: 'power2.out' },
      '-=0.25'
    );

    // ── Cinematic background ───────────────────────────────────
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Slow settle-in: the image eases from slightly zoomed to rest
    gsap.fromTo(bgImgRef.current,
      { scale: 1.2, opacity: 0 },
      { scale: 1.06, opacity: 1, duration: reduceMotion ? 0.01 : 2.4, ease: 'power3.out' }
    );
    gsap.fromTo(ambientRef.current,
      { opacity: 0 },
      { opacity: 0.5, duration: reduceMotion ? 0.01 : 2.2, ease: 'power2.out' }
    );

    if (!reduceMotion) {
      // The rocket hovers gently
      gsap.to(bgFloatRef.current, {
        y: -14, duration: 4.5, ease: 'sine.inOut', repeat: -1, yoyo: true,
      });

      // Parallax: the picture drifts slower than the page, the glow slower still
      const scrollCfg = { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: 0.8 };
      gsap.to(bgWrapRef.current,  { yPercent: 14, ease: 'none', scrollTrigger: scrollCfg });
      gsap.to(ambientRef.current, { yPercent: 8,  ease: 'none', scrollTrigger: scrollCfg });
      gsap.to(copyRef.current, {
        y: -36, ease: 'none',
        scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: '+=70%', scrub: 0.8 },
      });

      // The "Scroll" cue fades out as soon as the visitor scrolls
      gsap.to('.hero-scroll-cue', {
        opacity: 0, ease: 'none',
        scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: '+=180', scrub: true },
      });

      // Mouse parallax (desktop pointers only)
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px) and (pointer: fine)', () => {
        const xTo = gsap.quickTo(bgImgRef.current, 'x', { duration: 1.4, ease: 'power3' });
        const yTo = gsap.quickTo(bgImgRef.current, 'y', { duration: 1.4, ease: 'power3' });
        const onMove = (e) => {
          xTo((e.clientX / window.innerWidth - 0.5) * -26);
          yTo((e.clientY / window.innerHeight - 0.5) * -18);
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        return () => window.removeEventListener('pointermove', onMove);
      });
    }

  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="home" className="hero-root">

      {/* ── Cinematic background image ────────────────────────── */}
      <div className="hero-bg" aria-hidden="true">
        <div ref={ambientRef} className="hero-bg-ambient" />
        <div ref={bgWrapRef} className="hero-bg-wrap">
          <div ref={bgFloatRef} className="hero-bg-float">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={bgImgRef}
              className="hero-bg-img"
              src="/images/hero-rocket.jpg"
              alt=""
              fetchPriority="high"
              decoding="async"
              draggable={false}
            />
          </div>
        </div>
        <div className="hero-bg-shade" />
      </div>

      {/* ── Crypto Ticker Bar ─────────────────────────────────── */}
      <div
        ref={tickerBarRef}
        className="hero-ticker"
        style={{
          background: 'rgba(16,16,26,0.95)',
          borderTop: '1px solid rgba(201,168,76,0.1)',
          borderBottom: '1px solid rgba(201,168,76,0.1)',
          padding: '10px 0',
          overflow: 'hidden',
          position: 'relative',
          opacity: 0,
        }}
      >
        {/* Left fade */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 2,
          background: 'linear-gradient(90deg, #10101a, transparent)',
          pointerEvents: 'none',
        }} />
        {/* Right fade */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, zIndex: 2,
          background: 'linear-gradient(-90deg, #10101a, transparent)',
          pointerEvents: 'none',
        }} />

        {/* Scrolling track */}
        <div
          ref={tickerRef}
          style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', willChange: 'transform' }}
        >
          <div ref={marqueeRef} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {cryptoTicker.map((coin, i) => (
              <div
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 28px',
                  borderRight: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {/* Coin icon */}
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: `${coinColors[coin.symbol]}22`,
                  border: `1px solid ${coinColors[coin.symbol]}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <i
                    className={coinIcons[coin.symbol]}
                    style={{ fontSize: 11, color: coinColors[coin.symbol] }}
                  ></i>
                </div>

                {/* Symbol */}
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e8e8f0' }}>
                  {coin.symbol}
                </span>

                {/* Price */}
                <span style={{ fontSize: 13, color: '#9898b8' }}>
                  {coin.price}
                </span>

                {/* Change */}
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: coin.up ? '#22c55e' : '#ef4444',
                }}>
                  {coin.up ? '▲' : '▼'} {coin.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hero Content ──────────────────────────────────────── */}
      <div className="hero-grid">

        {/* Left — Text content */}
        <div ref={copyRef} className="hero-copy">

          {/* Badge */}
          <div ref={badgeRef} style={{ opacity: 0, marginBottom: 28 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 16px',
              borderRadius: 100,
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
              fontSize: 12,
              fontWeight: 600,
              color: '#c9a84c',
              letterSpacing: '0.04em',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
                animation: 'pulseGreen 2s ease-in-out infinite',
              }} />
              TRUSTED CRYPTO INVESTMENT PLATFORM
            </span>
          </div>

          {/* Headline */}
          <div ref={headlineRef} style={{ marginBottom: 28 }}>
            <div className="hero-line" style={{
              opacity: 0,
              fontSize: 'clamp(36px, 5vw, 58px)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#f0f0fa',
              marginBottom: 4,
            }}>
              Start Your Journey
            </div>
            <div className="hero-line" style={{
              opacity: 0,
              fontSize: 'clamp(36px, 5vw, 58px)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: 16,
            }}>
              <span style={{ color: '#f0f0fa' }}>with</span>
              <span style={{
                background: 'linear-gradient(135deg, #c9a84c, #e8c96a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}> VAULTEX</span>
            </div>
            <div className="hero-line" style={{
              opacity: 0,
              fontSize: 'clamp(15px, 2vw, 18px)',
              fontWeight: 500,
              color: '#9898b8',
              lineHeight: 1.5,
            }}>
              VAULTEX is the most trusted{' '}
              <span style={{ color: '#c9a84c', fontWeight: 600 }}>
                Crypto Investment Platform
              </span>
            </div>
          </div>

          {/* Bullet points */}
          <div
            ref={bulletsRef}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}
          >
            {bulletPoints.map((point, i) => (
              <div
                key={i}
                className="bullet-item"
                style={{
                  opacity: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'rgba(201,168,76,0.1)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <i className="fas fa-chevron-right" style={{ fontSize: 8, color: '#c9a84c' }}></i>
                </div>
                <span style={{ fontSize: 15, color: '#b8b8d0', fontWeight: 500 }}>
                  {point}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div
            ref={ctaRef}
            style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
          >
            <Link href="/register" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '14px 32px',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #c9a84c, #a8722a)',
                  color: '#0a0a0f',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 24px rgba(201,168,76,0.25)',
                  letterSpacing: '0.01em',
                  opacity: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 36px rgba(201,168,76,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(201,168,76,0.25)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px) scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1)';
                }}
              >
                Start Investing
                <i className="fas fa-arrow-right" style={{ fontSize: 13 }}></i>
              </button>
            </Link>

            <Link href="#plans" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '14px 32px',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: '#9898b8',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.25s ease',
                  letterSpacing: '0.01em',
                  opacity: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)';
                  e.currentTarget.style.color = '#c9a84c';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.background = 'rgba(201,168,76,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#9898b8';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <i className="fas fa-play-circle" style={{ fontSize: 15 }}></i>
                View Plans
              </button>
            </Link>
          </div>

        </div>

      </div>

      {/* Scroll cue — glides to the next section */}
      <button
        type="button"
        className="hero-scroll-cue"
        aria-label="Scroll to explore"
        onClick={() => {
          const target = document.getElementById('live-market');
          if (!target) return;
          if (window.__lenis) window.__lenis.scrollTo(target, { offset: -72, duration: 1.6 });
          else target.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        Scroll
        <span className="hero-scroll-line" />
      </button>

      {/* Hero styles */}
      <style>{`
        @keyframes pulseGreen {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }

        /* ── Hero background + layout ──────────────────────────── */
        .hero-root {
          position: relative;
          overflow: hidden;
          background: #0a0a0f;
          padding-top: 80px;
        }
        .hero-ticker { position: relative; z-index: 2; }

        .hero-bg {
          position: absolute; inset: 0; z-index: 0;
          pointer-events: none; overflow: hidden;
        }
        .hero-bg-ambient {
          position: absolute; top: 0; left: -6%; right: -6%;
          /* only the first screen: everything below is the normal dark page */
          height: calc(100svh + 120px);
          background: url('/images/hero-rocket-blur.webp') center / cover no-repeat;
          filter: saturate(1.2) brightness(0.8);
          opacity: 0;
          will-change: transform;
          /* keep the left (text) side pure dark; glow only lives on the right */
          -webkit-mask-image: linear-gradient(90deg, transparent 30%, #000 75%), linear-gradient(180deg, #000 55%, transparent 100%);
                  mask-image: linear-gradient(90deg, transparent 30%, #000 75%), linear-gradient(180deg, #000 55%, transparent 100%);
          -webkit-mask-composite: source-in;
                  mask-composite: intersect;
        }
        .hero-bg-wrap {
          position: absolute; top: 96px; right: 0;
          width: min(60vw, 780px);
          height: calc(100svh - 96px + 120px);
          overflow: hidden;
          will-change: transform;
          /* The picture dissolves into the page: transparent on its left edge
             and at the bottom, so there is never a visible seam. */
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 38%), linear-gradient(180deg, #000 70%, transparent 100%);
                  mask-image: linear-gradient(90deg, transparent 0%, #000 38%), linear-gradient(180deg, #000 70%, transparent 100%);
          -webkit-mask-composite: source-in;
                  mask-composite: intersect;
        }
        .hero-bg-wrap::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(180deg, rgba(10,10,15,0.5) 0%, rgba(10,10,15,0) 14%);
        }
        .hero-bg-float { position: absolute; inset: -3%; }
        .hero-bg-img {
          display: block; width: 100%; height: 100%;
          object-fit: cover; object-position: 50% 12%;
          will-change: transform;
        }
        .hero-bg-shade {
          position: absolute; inset: 0;
          background:
            linear-gradient(90deg, #0a0a0f 0%, rgba(10,10,15,0.6) 40%, rgba(10,10,15,0) 70%),
            linear-gradient(180deg, rgba(10,10,15,0) 70%, #0a0a0f 100%);
        }

        .hero-grid {
          position: relative; z-index: 2;
          max-width: 1200px; margin: 0 auto;
          padding: 0 24px 40px;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
        }
        .hero-copy {
          grid-column: 1; grid-row: 1;
          max-width: 580px;
          min-height: calc(100svh - 130px);
          display: flex; flex-direction: column; justify-content: center;
          padding: 56px 0 72px;
          will-change: transform;
        }
        .hero-scroll-cue {
          position: absolute; z-index: 3;
          left: 50%; top: calc(100svh - 76px);
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          background: none; border: none; cursor: pointer;
          color: #9898b8; font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.24em; text-transform: uppercase;
          transition: color .25s ease;
        }
        .hero-scroll-cue:hover { color: #c9a84c; }
        .hero-scroll-line {
          position: relative; display: block; overflow: hidden;
          width: 1px; height: 36px; background: rgba(201,168,76,0.25);
        }
        .hero-scroll-line::after {
          content: ''; position: absolute; left: 0; top: -100%;
          width: 100%; height: 100%; background: #c9a84c;
          animation: heroScrollCue 1.9s ease-in-out infinite;
        }
        @keyframes heroScrollCue {
          0%   { top: -100%; }
          60%  { top: 100%; }
          100% { top: 100%; }
        }

        /* Tablet + phone: picture across the top, text and card below it */
        @media (max-width: 899px) {
          .hero-bg-wrap {
            top: 0; left: 0; right: 0; margin: 0 auto;
            width: min(100%, 520px); height: 640px; bottom: auto;
            -webkit-mask-image: none; mask-image: none;
          }
          .hero-bg-wrap::after {
            background: linear-gradient(180deg, rgba(10,10,15,0.55) 0, rgba(10,10,15,0) 140px, rgba(10,10,15,0) 250px, rgba(10,10,15,0.85) 470px, #0a0a0f 640px);
          }
          .hero-bg-shade { display: none; }
          .hero-bg-ambient { display: none; }
          .hero-grid { display: flex; flex-direction: column; padding: 0 20px 40px; }
          .hero-copy {
            min-height: 0; max-width: none;
            padding: calc(min(100vw, 520px) * 0.977 - 85px) 0 40px;
          }
          .hero-scroll-cue { display: none; }
        }
        @media (min-width: 521px) and (max-width: 899px) {
          .hero-bg-wrap {
            -webkit-mask-image: linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent);
                    mask-image: linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-scroll-line::after { animation: none; }
        }

      `}</style>

    </section>
  );
}