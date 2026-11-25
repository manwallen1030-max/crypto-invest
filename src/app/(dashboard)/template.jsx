'use client';

// Runs on every dashboard navigation (templates remount per route). Gives each
// page a soft GSAP entrance and resets scroll to the top using Lenis so the
// jump itself is smooth instead of abrupt.

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function DashboardTemplate({ children }) {
  const ref = useRef(null);

  useGSAP(() => {
    window.__lenis?.scrollTo(0, { immediate: true });
    gsap.fromTo(ref.current, { opacity: 0, y: 18 }, {
      opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', clearProps: 'transform',
    });

    // Scroll-reveal for anything a page marks with data-reveal.
    const targets = ref.current?.querySelectorAll('[data-reveal]') || [];
    targets.forEach((el) => {
      gsap.fromTo(el, { y: 36, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
    const t = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => clearTimeout(t);
  }, { scope: ref });

  return <div ref={ref}>{children}</div>;
}
