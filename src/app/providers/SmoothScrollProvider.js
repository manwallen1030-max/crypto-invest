'use client';

// Smooth scrolling for the whole site.
//
// Lenis eases the page's scroll position; GSAP's ticker drives it so
// ScrollTrigger animations (parallax, reveals, progress bar) stay perfectly in
// step with what is on screen. The instance is exposed as window.__lenis so
// menus can pause page scrolling and buttons can glide to a section.

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScrollProvider({ children }) {
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      duration: 1.2,
      // Expo ease-out: quick to react, long soft landing
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reduce,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.3,
      // #hash links (and router hash changes) glide, leaving room for the navbar
      anchors: { offset: -72, duration: 1.5 },
    });
    window.__lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Images and fonts change page height after first paint; re-measure so
    // scroll-linked animations land in the right place.
    const refresh = () => { lenis.resize(); ScrollTrigger.refresh(); };
    window.addEventListener('load', refresh);
    document.fonts?.ready?.then(refresh);

    return () => {
      window.removeEventListener('load', refresh);
      gsap.ticker.remove(tick);
      lenis.destroy();
      if (window.__lenis === lenis) window.__lenis = null;
    };
  }, []);

  return <>{children}</>;
}
