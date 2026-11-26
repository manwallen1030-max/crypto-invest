'use client';

// Back-to-top button for the public site. It appears once you have scrolled a
// screen down and glides back up with Lenis.

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ArrowUp } from 'lucide-react';

export default function ScrollUI() {
  const pathname = usePathname();
  const topRef = useRef(null);
  // The dashboards have their own chrome
  const hidden = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  useEffect(() => {
    if (hidden) return;
    const btn = topRef.current;
    if (!btn) return;

    gsap.set(btn, { autoAlpha: 0, y: 16 });
    let shown = false;

    const update = () => {
      const should = window.scrollY > window.innerHeight * 0.8;
      if (should !== shown) {
        shown = should;
        gsap.to(btn, { autoAlpha: should ? 1 : 0, y: should ? 0 : 16, duration: 0.45, ease: 'power3.out' });
      }
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [hidden, pathname]);

  if (hidden) return null;

  const toTop = () => {
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.8 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      ref={topRef}
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 28, zIndex: 2147482000,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none', visibility: 'hidden',
      }}
    >
      <button type="button" onClick={toTop} aria-label="Back to top" className="back-to-top">
        <ArrowUp size={18} strokeWidth={2.4} />
      </button>
    </div>
  );
}
