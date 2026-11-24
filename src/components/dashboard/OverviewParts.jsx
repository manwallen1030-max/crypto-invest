'use client';

// Building blocks for the Investments / Deposit / Withdraw overview pages.
// They reuse the look of the main dashboard's stat and quick-action cards.

import Link from 'next/link';
import NotificationBadge from './NotificationBadge';

export function OverviewHeader({ title, subtitle, actionHref, actionLabel, actionIcon = 'fas fa-plus' }) {
  return (
    <div className="ov-section" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 24, flexWrap: 'wrap', gap: 12,
    }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f0fa', marginBottom: 4, letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        <p style={{ fontSize: 13.5, color: '#5a5a78' }}>{subtitle}</p>
      </div>
      {actionHref && (
        <Link href={actionHref} style={{
          padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
          background: 'linear-gradient(135deg, #c9a84c, #a8722a)', color: '#0a0a0f',
          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <i className={actionIcon}></i>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function SectionTitle({ children }) {
  return (
    <div className="ov-section" style={{ fontSize: 15, fontWeight: 700, color: '#f0f0fa', marginBottom: 14 }}>
      {children}
    </div>
  );
}

export function StatGrid({ children }) {
  return (
    <div className="ov-section" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
      gap: 16, marginBottom: 28,
    }}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, icon, color }) {
  return (
    <div
      style={{
        background: 'rgb(20,20,36)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '4px 16px 16px 16px',
        padding: '20px',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}30`;
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}15`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <i className={icon} style={{ color, fontSize: 16 }}></i>
      </div>
      <div style={{ fontSize: 12, color: '#5a5a78', marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#f0f0fa', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: '#5a5a78', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export function QuickLinkGrid({ children }) {
  return (
    <div className="ov-section" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 16,
    }}>
      {children}
    </div>
  );
}

export function QuickLink({ href, label, desc, icon, color, badge }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: 'linear-gradient(145deg, rgba(20,20,36,0.95), rgba(12,12,22,0.98))',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px 16px 4px 16px',
          padding: '20px',
          display: 'flex', alignItems: 'center', gap: 14,
          cursor: 'pointer', transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${color}30`;
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${color}15`, border: `1px solid ${color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={icon} style={{ color, fontSize: 18 }}></i>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0fa', marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 12, color: '#5a5a78' }}>{desc}</div>
        </div>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <NotificationBadge count={badge} />
          <i className="fas fa-arrow-right" style={{ color: '#5a5a78', fontSize: 12 }}></i>
        </span>
      </div>
    </Link>
  );
}
