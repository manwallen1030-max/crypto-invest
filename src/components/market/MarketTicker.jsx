'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMarket, formatUsd, formatPct } from '@/lib/market';
import CoinLogo from './CoinLogo';

// Slim, endlessly scrolling price strip (GSAP-driven so it can pause on hover
// and speed up smoothly rather than jumping).
export default function MarketTicker() {
  const { coins, loading } = useMarket();
  const trackRef = useRef(null);
  const tweenRef = useRef(null);

  useGSAP(() => {
    const track = trackRef.current;
    if (!track || !coins.length) return;
    const half = track.scrollWidth / 2;
    tweenRef.current?.kill();
    tweenRef.current = gsap.fromTo(
      track,
      { x: 0 },
      { x: -half, duration: Math.max(30, coins.length * 6), ease: 'none', repeat: -1 }
    );
    return () => tweenRef.current?.kill();
  }, { dependencies: [coins.length], scope: trackRef });

  const slow = () => tweenRef.current && gsap.to(tweenRef.current, { timeScale: 0, duration: 0.5 });
  const resume = () => tweenRef.current && gsap.to(tweenRef.current, { timeScale: 1, duration: 0.6 });

  const items = coins.length ? [...coins, ...coins] : [];

  return (
    <div
      onMouseEnter={slow}
      onMouseLeave={resume}
      onTouchStart={slow}
      onTouchEnd={resume}
      aria-label="Live crypto prices"
      style={{
        height: 38, overflow: 'hidden', position: 'relative',
        background: '#0c0c14', borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center',
      }}
    >
      {loading && !coins.length ? (
        <div style={{ padding: '0 20px', fontSize: 11.5, color: '#6a6a88' }}>Loading live prices…</div>
      ) : !coins.length ? (
        <div style={{ padding: '0 20px', fontSize: 11.5, color: '#6a6a88' }}>Live prices unavailable right now</div>
      ) : (
        <div ref={trackRef} style={{ display: 'flex', gap: 28, paddingLeft: 20, whiteSpace: 'nowrap', willChange: 'transform' }}>
          {items.map((c, i) => {
            const ch = c.changes?.['24h'];
            const up = (ch ?? 0) >= 0;
            const Arrow = up ? TrendingUp : TrendingDown;
            return (
              <span key={`${c.id}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <CoinLogo src={c.image} symbol={c.symbol} size={16} />
                <b style={{ color: '#f0f0fa', fontWeight: 700 }}>{c.symbol}</b>
                <span style={{ color: '#9898b8', fontVariantNumeric: 'tabular-nums' }}>{formatUsd(c.price)}</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600,
                  color: up ? '#16c784' : '#ea3943', fontVariantNumeric: 'tabular-nums',
                }}>
                  <Arrow size={12} strokeWidth={2.4} /> {formatPct(ch)}
                </span>
              </span>
            );
          })}
        </div>
      )}
      {/* edge fades */}
      <div aria-hidden style={{ position: 'absolute', inset: '0 auto 0 0', width: 28, background: 'linear-gradient(90deg,#0c0c14,transparent)', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: '0 0 0 auto', width: 28, background: 'linear-gradient(270deg,#0c0c14,transparent)', pointerEvents: 'none' }} />
    </div>
  );
}
