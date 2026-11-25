'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { LayoutGrid, TrendingUp, ArrowLeftRight, ArrowUpFromLine, Plus } from 'lucide-react';

// Mobile-only quick actions. Everything else is reached through the hamburger.
const ITEMS = [
  { label: 'Home',     href: '/dashboard',                    icon: LayoutGrid, exact: true },
  { label: 'Invest',   href: '/dashboard/investments/invest', icon: TrendingUp },
  { label: 'Deposit',  href: '/dashboard/deposit/new',        icon: Plus, primary: true },
  { label: 'Withdraw', href: '/dashboard/withdraw/new',       icon: ArrowUpFromLine },
  { label: 'History',  href: '/dashboard/transactions',       icon: ArrowLeftRight },
];

export default function BottomNav() {
  const pathname = usePathname();
  const barRef = useRef(null);
  const dotRef = useRef(null);
  const itemRefs = useRef([]);

  const activeIndex = ITEMS.findIndex((it) =>
    it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(`${it.href}/`)
  );

  useLayoutEffect(() => {
    const dot = dotRef.current;
    const el = itemRefs.current[activeIndex];
    if (!dot) return;
    if (!el) { gsap.to(dot, { opacity: 0, duration: 0.2 }); return; }
    const x = el.offsetLeft + el.offsetWidth / 2 - 10;
    gsap.to(dot, { x, opacity: 1, duration: 0.55, ease: 'elastic.out(1, 0.7)' });
    gsap.fromTo(el.querySelector('svg'), { y: 4, scale: 0.85 }, { y: 0, scale: 1, duration: 0.5, ease: 'back.out(2.4)' });
  }, [activeIndex]);

  useLayoutEffect(() => {
    gsap.fromTo(barRef.current, { y: 90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power4.out', delay: 0.25 });
  }, []);

  const press = (e, down) =>
    gsap.to(e.currentTarget, { scale: down ? 0.88 : 1, duration: 0.18, ease: 'power2.out' });

  return (
    <nav ref={barRef} className="bottom-nav" aria-label="Quick navigation">
      <div ref={dotRef} aria-hidden className="bottom-nav-dot" />
      {ITEMS.map((it, i) => {
        const Icon = it.icon;
        const active = i === activeIndex;
        return (
          <Link
            key={it.href}
            href={it.href}
            ref={(el) => { itemRefs.current[i] = el; }}
            aria-current={active ? 'page' : undefined}
            onPointerDown={(e) => press(e, true)}
            onPointerUp={(e) => press(e, false)}
            onPointerLeave={(e) => press(e, false)}
            className={`bottom-nav-item${it.primary ? ' is-primary' : ''}${active ? ' is-active' : ''}`}
          >
            <span className="bottom-nav-icon">
              <Icon size={it.primary ? 22 : 21} strokeWidth={it.primary ? 2.6 : 2} />
            </span>
            <span className="bottom-nav-label">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
