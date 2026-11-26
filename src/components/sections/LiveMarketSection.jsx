'use client';

// Live market chart shown right under the hero.
//
// Built so it can never slow the first paint:
//  • the chart code is a separate chunk, only downloaded when needed
//  • nothing loads (no JS, no network request) until the page has fully
//    finished loading AND the visitor is within ~200px of this section
//  • it reserves its height up front, so the page doesn't jump when it appears

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Radio } from 'lucide-react';
import { MarketProvider } from '@/lib/market';

gsap.registerPlugin(ScrollTrigger);

function ChartSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        minHeight: 640, borderRadius: 18, background: '#13131f',
        border: '1px solid rgba(255,255,255,0.06)', padding: 18,
      }}
    >
      <div className="skeleton" style={{ height: 34, width: '60%', marginBottom: 22 }} />
      <div className="skeleton" style={{ height: 44, width: '38%', marginBottom: 26 }} />
      <div className="skeleton" style={{ height: 330, width: '100%' }} />
    </div>
  );
}

const MarketChart = dynamic(() => import('@/components/market/MarketChart'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export default function LiveMarketSection() {
  const sectionRef = useRef(null);
  const [near, setNear] = useState(false);
  const [idle, setIdle] = useState(false);

  // 1) Never compete with the first paint: wait until the whole page has
  //    finished loading, then a short pause.
  useEffect(() => {
    let timer;
    const arm = () => { timer = setTimeout(() => setIdle(true), 1500); };
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });
    return () => { clearTimeout(timer); window.removeEventListener('load', arm); };
  }, []);

  // 2) ...and only once the visitor is within ~200px of the section.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); io.disconnect(); }
    }, { rootMargin: '200px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const showChart = near && idle;

  useGSAP(() => {
    gsap.fromTo('.lm-head > *', { y: 28, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.lm-head', start: 'top 85%', once: true },
    });
    gsap.fromTo('.lm-body', { y: 44, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '.lm-body', start: 'top 90%', once: true },
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="live-market"
      style={{ background: '#0a0a0f', padding: '30px 24px 90px', position: 'relative' }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="lm-head" style={{ textAlign: 'center', marginBottom: 38 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100,
            background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
            color: '#c9a84c', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.12em',
          }}>
            <Radio size={13} /> LIVE MARKETS
          </span>
          <h2 style={{
            margin: '16px 0 10px', fontSize: 'clamp(26px, 4.2vw, 40px)', fontWeight: 800,
            letterSpacing: '-0.02em', color: '#f0f0fa',
          }}>
            Watch the market move in real time
          </h2>
          <p style={{ margin: '0 auto', maxWidth: 560, fontSize: 15, lineHeight: 1.6, color: '#9898b8' }}>
            Live prices and charts for the top cryptocurrencies. Pick a coin, change the time range,
            and see exactly what the market is doing right now.
          </p>
        </div>

        <div className="lm-body">
          {showChart ? (
            <MarketProvider>
              <MarketChart />
            </MarketProvider>
          ) : (
            <ChartSkeleton />
          )}

          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <Link href="/register" className="btn-solid" style={{ padding: '13px 28px', fontSize: 14 }}>
              Start investing today <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
