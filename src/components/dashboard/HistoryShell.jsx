'use client';


import FaIcon from '@/components/ui/FaIcon';
// Shared frame for the three History pages (Investment, Deposit, Withdrawal).
//
// It loads the user's records from `endpoint`, shows them under status filter
// chips, refreshes them automatically, and tells the server the user has seen
// them (which clears that section's sidebar badge). Each page only decides how
// one record looks, via `renderItem`.

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';
import { markHistorySeen } from '@/lib/notificationBadges';

const POLL_MS = 30 * 1000;

export default function HistoryShell({
  title,
  subtitle,
  badgeType,      // 'DEPOSIT' | 'WITHDRAWAL' | 'INVESTMENT'
  endpoint,       // e.g. '/api/user/deposits'
  dataKey,        // property of the JSON response that holds the array
  statusMeta,     // one of the maps in src/lib/statusMeta.js
  noun,           // 'deposits', used in empty/error messages
  icon,           // Font Awesome classes for the empty state
  actionHref,
  actionLabel,
  renderItem,
}) {
  const pageRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useGSAP(() => {
    gsap.fromTo(
      pageRef.current?.querySelectorAll('.hs-section') || [],
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'power2.out' }
    );
  }, { scope: pageRef });

  useEffect(() => {
    let cancelled = false;
    let warned = false;

    const load = async () => {
      try {
        const res = await fetch(endpoint, { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setItems(data[dataKey] || []);
          // The user is looking at their records, so clear this section's badge.
          markHistorySeen(badgeType);
        } else if (!warned) {
          warned = true;
          toast.error(data.error || `Could not load your ${noun}`);
        }
      } catch {
        if (!cancelled && !warned) {
          warned = true;
          toast.error(`Network error. Could not load your ${noun}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    // Pick up status changes made by the admin while this page is open.
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    window.addEventListener('focus', load);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', load);
    };
  }, [endpoint, dataKey, badgeType, noun]);

  const countByStatus = items.reduce((acc, it) => {
    acc[it.status] = (acc[it.status] || 0) + 1;
    return acc;
  }, {});
  const visible = filter === 'ALL' ? items : items.filter((it) => it.status === filter);
  const filters = ['ALL', ...Object.keys(statusMeta)];

  return (
    <div ref={pageRef} style={{ maxWidth: 760 }}>

      <div className="hs-section" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f0fa', marginBottom: 4, letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          <p style={{ fontSize: 13.5, color: '#6a6a88' }}>{subtitle}</p>
        </div>
        {actionHref && (
          <Link href={actionHref} style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: 'linear-gradient(135deg, #c9a84c, #a8722a)', color: '#0a0a0f',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <FaIcon className="fas fa-plus" />
            {actionLabel}
          </Link>
        )}
      </div>

      {/* Status filters */}
      <div className="hs-section" style={{
        display: 'flex', gap: 8, marginBottom: 18, overflowX: 'auto', paddingBottom: 4,
      }}>
        {filters.map((f) => {
          const meta = f === 'ALL' ? { label: 'All', color: '#c9a84c' } : statusMeta[f];
          const active = filter === f;
          const count = f === 'ALL' ? items.length : countByStatus[f] || 0;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flexShrink: 0, padding: '8px 14px', borderRadius: 100, fontSize: 12.5, fontWeight: 600,
                background: active ? `${meta.color}18` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? `${meta.color}50` : 'rgba(255,255,255,0.08)'}`,
                color: active ? meta.color : '#9898b8',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease',
              }}
            >
              {meta.label}{count > 0 ? ` · ${count}` : ''}
            </button>
          );
        })}
      </div>

      {/* Records */}
      <div className="hs-section">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <FaIcon className="fas fa-spinner fa-spin" style={{ color: '#c9a84c', fontSize: 18 }} />
          </div>
        ) : visible.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16,
          }}>
            <FaIcon className={icon} style={{ fontSize: 26, color: '#3a3a52', marginBottom: 12, display: 'block' }} />
            <div style={{ fontSize: 14, color: '#9898b8' }}>
              {filter === 'ALL'
                ? `No ${noun} yet`
                : `No ${statusMeta[filter].label.toLowerCase()} ${noun}`}
            </div>
          </div>
        ) : (
          <div style={{
            background: '#13131f',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden',
          }}>
            {visible.map((item, i) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                borderBottom: i < visible.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                {renderItem(item)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
