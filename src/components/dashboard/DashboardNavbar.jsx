'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Bell, BellOff, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { useBadges } from '@/lib/notificationBadges';
import NotificationBadge from '@/components/dashboard/NotificationBadge';
import { useHideBalance, money } from '@/components/dashboard/WalletCard';

export default function DashboardNavbar({ user, onMenuClick }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [hidden, toggleHidden] = useHideBalance();
  const badges = useBadges();
  const unreadUpdates = (badges.INVESTMENT || 0) + (badges.DEPOSIT || 0) + (badges.WITHDRAWAL || 0) + (badges.KYC || 0);

  return (
    <header className="dash-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button type="button" onClick={onMenuClick} aria-label="Open menu" className="icon-btn" style={{ position: 'relative' }}>
          <Menu size={20} />
          <NotificationBadge count={unreadUpdates} style={{ position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, fontSize: 9 }} />
        </button>

        <div className="dash-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 26, height: 26, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg,#c9a84c,#a8722a)',
            }}>
              <TrendingUp size={14} color="#0a0a0f" strokeWidth={2.6} />
            </span>
            <span className="brand-word" style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "0.03em" }}>VAULTEX</span>
          </div>
          <div className="dash-welcome" style={{ fontSize: 11.5, color: '#6a6a88', marginTop: 2 }}>
            Welcome back, {user?.firstName}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Balance chip — always visible at the top */}
        <button type="button" onClick={toggleHidden} className="balance-chip" aria-label={hidden ? 'Show balance' : 'Hide balance'}>
          <span className="balance-chip-label">Balance</span>
          <span style={{ fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {hidden ? '$••••••' : `$${money(user?.balance || 0)}`}
          </span>
          {hidden ? <EyeOff size={14} color="#9898b8" /> : <Eye size={14} color="#9898b8" />}
        </button>

        <div style={{ position: 'relative' }}>
          <button type="button" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications" aria-expanded={notifOpen} className="icon-btn" style={{ position: 'relative' }}>
            <Bell size={18} />
            {unreadUpdates > 0 && <span style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: '50%', background: '#ea3943', boxShadow: '0 0 6px #ea3943' }} />}
          </button>

          {notifOpen && (
            <div style={{
              position: 'absolute', top: 48, right: 0, width: 'min(300px, 86vw)', background: '#13131f',
              border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.55)', zIndex: 100, overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13, fontWeight: 700, color: '#f0f0fa' }}>
                Notifications
              </div>
              <div style={{ padding: '26px 16px', textAlign: 'center' }}>
                <BellOff size={24} color="#5a5a78" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 13, color: '#6a6a88' }}>No notifications yet</div>
              </div>
            </div>
          )}
        </div>

        <Link href="/dashboard/settings" aria-label="Profile settings" className="avatar-btn">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>{user?.firstName?.[0]}{user?.lastName?.[0]}</>
          )}
        </Link>
      </div>
    </header>
  );
}
