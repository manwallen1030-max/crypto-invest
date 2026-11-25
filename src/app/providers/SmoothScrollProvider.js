'use client';

// Lenis gives us buttery smooth scrolling across the entire site, driven by
// GSAP's ticker so ScrollTrigger animations and Lenis never drift apart.
// The instance is exposed as window.__lenis so the dashboard drawer can pause
// page scrolling while it is open and page transitions can scroll to top.

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScrollProvider({ children }) {
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: !reduce,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
      anchors: true,
    });
    window.__lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      if (window.__lenis === lenis) window.__lenis = null;
    };
  }, []);

  return <>{children}</>;
}
