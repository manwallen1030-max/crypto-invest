'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { gsap } from 'gsap';
import { X, ChevronDown, LogOut, TrendingUp } from 'lucide-react';
import { companyLinks, legalLinks } from '@/lib/siteConfig';
import { useBadges } from '@/lib/notificationBadges';
import NotificationBadge from '@/components/dashboard/NotificationBadge';
import WalletCard from '@/components/dashboard/WalletCard';
import FaIcon from '@/components/ui/FaIcon';

// A link with `children` becomes an expandable dropdown. Its own href is the
// section's overview page; each child is a page inside the section. A child
// with a `badge` shows the unread-update count for that Notification type.
const navItems = [
  {
    group: 'Overview',
    links: [
      { label: 'Dashboard',    href: '/dashboard',              icon: 'fas fa-grid-2' },
      {
        label: 'Investments', href: '/dashboard/investments', icon: 'fas fa-chart-line',
        children: [
          { label: 'Overview',          href: '/dashboard/investments' },
          { label: 'Invest Now',         href: '/dashboard/investments/invest' },
          { label: 'My Investments',     href: '/dashboard/investments/my' },
          { label: 'Investment History', href: '/dashboard/investments/history', badge: 'INVESTMENT' },
        ],
      },
      { label: 'Transactions', href: '/dashboard/transactions', icon: 'fas fa-arrow-right-arrow-left' },
    ],
  },
  {
    group: 'Finance',
    links: [
      {
        label: 'Deposit', href: '/dashboard/deposit', icon: 'fas fa-circle-arrow-down',
        children: [
          { label: 'Overview',        href: '/dashboard/deposit' },
          { label: 'Deposit Now',     href: '/dashboard/deposit/new' },
          { label: 'Deposit History', href: '/dashboard/deposit/history', badge: 'DEPOSIT' },
        ],
      },
      {
        label: 'Withdraw', href: '/dashboard/withdraw', icon: 'fas fa-circle-arrow-up',
        children: [
          { label: 'Overview',          href: '/dashboard/withdraw' },
          { label: 'Withdraw Now',       href: '/dashboard/withdraw/new' },
          { label: 'Withdrawal History', href: '/dashboard/withdraw/history', badge: 'WITHDRAWAL' },
        ],
      },
      { label: 'Referrals',  href: '/dashboard/referrals',  icon: 'fas fa-users' },
    ],
  },
  {
    group: 'Account',
    links: [
      { label: 'KYC Verify',  href: '/dashboard/kyc',      icon: 'fas fa-id-card', badge: 'KYC' },
      { label: 'Support',     href: '/dashboard/support',   icon: 'fas fa-headset' },
      { label: 'Settings',    href: '/dashboard/settings',  icon: 'fas fa-gear' },
    ],
  },
];

const ACCENT = '#c9a84c';

function groupHrefFor(pathname) {
  for (const section of navItems) {
    for (const link of section.links) {
      if (link.children && (pathname === link.href || pathname.startsWith(`${link.href}/`))) return link.href;
    }
  }
  return null;
}

function NavDropdown({ link, pathname, open, onToggle, badges }) {
  const isOverview = pathname === link.href;
  const inGroup = isOverview || pathname.startsWith(`${link.href}/`);
  const total = link.children.reduce((t, c) => t + (c.badge ? badges[c.badge] || 0 : 0), 0);
  const panelId = `sidebar-group-${link.label.toLowerCase()}`;

  return (
    <div className="drawer-item" style={{ marginBottom: 2 }}>
      <div
        className="drawer-row"
        style={{
          display: 'flex', alignItems: 'center', borderRadius: 10,
          background: inGroup ? 'rgba(201,168,76,0.1)' : 'transparent',
          border: `1px solid ${inGroup ? 'rgba(201,168,76,0.22)' : 'transparent'}`,
        }}
      >
        <Link href={link.href} style={{
          textDecoration: 'none', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0 12px 12px',
        }}>
          <FaIcon className={link.icon} style={{ fontSize: 15, color: inGroup ? ACCENT : '#6a6a88' }} />
          <span style={{ fontSize: 14, fontWeight: inGroup ? 700 : 500, color: inGroup ? '#fff' : '#a8a8c4' }}>{link.label}</span>
          {!open && <NotificationBadge count={total} style={{ marginLeft: 'auto' }} />}
        </Link>
        <button
          type="button" onClick={onToggle} aria-expanded={open} aria-controls={panelId}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${link.label} menu`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '12px 14px', display: 'flex', alignItems: 'center', color: '#6a6a88' }}
        >
          <ChevronDown size={15} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s ease' }} />
        </button>
      </div>

      {open && (
        <div id={panelId} style={{ marginTop: 4, marginLeft: 20, paddingLeft: 10, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
          {link.children.map((child) => {
            const active = pathname === child.href;
            const count = child.badge ? badges[child.badge] || 0 : 0;
            return (
              <Link key={child.href} href={child.href} className="drawer-sub" style={{
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#e8c96a' : '#9898b8',
              }}>
                {child.label}
                <NotificationBadge count={count} style={{ marginLeft: 'auto' }} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardSidebar({ user, isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const [infoOpen, setInfoOpen] = useState(false);
  const badges = useBadges();
  const asideRef = useRef(null);
  const backdropRef = useRef(null);
  const firstRun = useRef(true);
  const tlRef = useRef(null);

  const activeGroup = groupHrefFor(pathname);
  const [openGroups, setOpenGroups] = useState(() => (activeGroup ? { [activeGroup]: true } : {}));
  const [prevActiveGroup, setPrevActiveGroup] = useState(activeGroup);
  if (prevActiveGroup !== activeGroup) {
    setPrevActiveGroup(activeGroup);
    if (activeGroup) setOpenGroups((o) => ({ ...o, [activeGroup]: true }));
  }
  const toggleGroup = (href) => setOpenGroups((o) => ({ ...o, [href]: !o[href] }));

  // Wallet numbers shown on the drawer card come from the same stored user.
  const balance = user?.balance || 0;

  // Close the drawer whenever the route changes (tapping a link navigates).
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      if (isOpen) onClose();
    }
  }, [pathname, isOpen, onClose]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // GSAP open / close choreography.
  useEffect(() => {
    const aside = asideRef.current;
    const backdrop = backdropRef.current;
    if (!aside || !backdrop) return;

    if (firstRun.current) {
      firstRun.current = false;
      gsap.set(aside, { xPercent: -105, autoAlpha: 0 });
      gsap.set(backdrop, { autoAlpha: 0 });
      return;
    }

    const lenis = typeof window !== 'undefined' ? window.__lenis : null;
    document.body.dataset.drawer = isOpen ? 'open' : 'closed';
    tlRef.current?.kill();
    const items = aside.querySelectorAll('.drawer-item, .drawer-group-title');
    const wallet = aside.querySelector('.drawer-wallet');

    if (isOpen) {
      lenis?.stop();
      tlRef.current = gsap.timeline()
        .to(backdrop, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' }, 0)
        .set(aside, { autoAlpha: 1 }, 0)
        .fromTo(aside, { xPercent: -105 }, { xPercent: 0, duration: 0.55, ease: 'power4.out' }, 0)
        .fromTo(wallet, { y: 24, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' }, 0.12)
        .fromTo(items, { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.03, ease: 'power3.out' }, 0.2);
    } else {
      lenis?.start();
      tlRef.current = gsap.timeline()
        .to(aside, { xPercent: -105, duration: 0.38, ease: 'power3.in' }, 0)
        .to(backdrop, { autoAlpha: 0, duration: 0.3 }, 0.05)
        .set(aside, { autoAlpha: 0 });
    }
  }, [isOpen]);

  useEffect(() => () => { window.__lenis?.start(); delete document.body.dataset.drawer; }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('vaultex_token');
    localStorage.removeItem('vaultex_user');
    router.push('/login');
  };

  return (
    <>
      <div
        ref={backdropRef}
        onClick={onClose}
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, background: 'rgba(3,6,12,0.66)', backdropFilter: 'blur(5px)', zIndex: 60, visibility: 'hidden' }}
      />

      <aside
        ref={asideRef}
        className="dashboard-sidebar"
        aria-label="Main menu"
        aria-hidden={!isOpen}
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 'min(340px, 90vw)',
          background: '#10101a',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', zIndex: 70,
          overflowY: 'auto', overscrollBehavior: 'contain',
          visibility: 'hidden',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Brand + close */}
        <div style={{ padding: '18px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg,#c9a84c,#a8722a)', boxShadow: '0 6px 18px rgba(168,114,42,0.4)',
            }}>
              <TrendingUp size={18} color="#0a0a0f" strokeWidth={2.6} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: '0.04em', color: '#fff' }}>VAULTEX</span>
          </Link>
          <button type="button" onClick={onClose} aria-label="Close menu" style={{
            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#a8a8c4', cursor: 'pointer',
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Wallet */}
        <div className="drawer-wallet" style={{ padding: '8px 16px 14px' }}>
          <WalletCard
            compact
            user={user}
            balance={balance}
            profit={user?.totalProfit || 0}
            deposited={user?.totalDeposited || 0}
            onNavigate={onClose}
          />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '6px 12px 12px' }}>
          {navItems.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 18 }}>
              <div className="drawer-group-title" style={{
                fontSize: 10.5, fontWeight: 700, color: '#5a5a78', letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '0 8px', marginBottom: 6,
              }}>
                {group.group}
              </div>

              {group.links.map((link, li) => {
                if (link.children) {
                  return (
                    <NavDropdown
                      key={li} link={link} pathname={pathname} badges={badges}
                      open={!!openGroups[link.href]} onToggle={() => toggleGroup(link.href)}
                    />
                  );
                }
                const isActive = pathname === link.href;
                return (
                  <Link key={li} href={link.href} className="drawer-item" style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
                    <div className="drawer-row" style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 10,
                      background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
                      border: `1px solid ${isActive ? 'rgba(201,168,76,0.22)' : 'transparent'}`,
                    }}>
                      <FaIcon className={link.icon} style={{ fontSize: 15, color: isActive ? ACCENT : '#6a6a88' }} />
                      <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? '#fff' : '#a8a8c4' }}>{link.label}</span>
                      {isActive && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />}
                      <NotificationBadge count={link.badge ? badges[link.badge] || 0 : 0} style={{ marginLeft: isActive ? 8 : 'auto' }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Legal & Info */}
          <div className="drawer-item" style={{ marginBottom: 8 }}>
            <button
              type="button" onClick={() => setInfoOpen((o) => !o)} aria-expanded={infoOpen} aria-controls="sidebar-info-links"
              className="drawer-row"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: '1px solid transparent',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FaIcon className="fas fa-circle-info" style={{ fontSize: 15, color: '#6a6a88' }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: '#a8a8c4' }}>Legal &amp; Info</span>
              </span>
              <ChevronDown size={15} color="#6a6a88" style={{ transform: infoOpen ? 'rotate(180deg)' : 'none', transition: 'transform .25s ease' }} />
            </button>

            {infoOpen && (
              <div id="sidebar-info-links" style={{ marginTop: 4, marginLeft: 20, paddingLeft: 10, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                {[...companyLinks, ...legalLinks].map((link) => (
                  <Link key={link.href} href={link.href} onClick={onClose} className="drawer-sub"
                    style={{ textDecoration: 'none', display: 'block', padding: '9px 10px', borderRadius: 8, fontSize: 13, color: '#9898b8' }}>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Logout */}
        <div style={{ padding: '14px 14px calc(14px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button type="button" onClick={handleLogout} style={{
            width: '100%', padding: '12px', borderRadius: 10, cursor: 'pointer',
            background: 'rgba(234,57,67,0.08)', border: '1px solid rgba(234,57,67,0.2)',
            color: '#ea3943', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
