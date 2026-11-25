'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import DashboardFooter from '@/components/dashboard/DashboardFooter';
import BottomNav from '@/components/dashboard/BottomNav';
import MarketTicker from '@/components/market/MarketTicker';
import AuthSession from '@/components/shared/AuthSession';
import { NotificationBadgesProvider } from '@/lib/notificationBadges';
import { MarketProvider } from '@/lib/market';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    const stored = localStorage.getItem('vaultex_user');
    const token = localStorage.getItem('vaultex_token');
    if (!stored || !token) {
      router.replace('/login');
      return;
    }
    setUser(JSON.parse(stored));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // The Settings page and refreshUser() update localStorage directly and then
    // dispatch this event so the navbar, drawer wallet and balance chip — which
    // hold their own copy of `user` here — update without a reload.
    const onUserUpdated = () => {
      const stored = localStorage.getItem('vaultex_user');
      if (stored) setUser(JSON.parse(stored));
    };
    window.addEventListener('vaultex:user-updated', onUserUpdated);
    return () => window.removeEventListener('vaultex:user-updated', onUserUpdated);
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0f', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #c9a84c, #a8722a)', boxShadow: '0 0 36px rgba(201,168,76,0.35)',
        }}>
          <TrendingUp size={24} color="#0a0a0f" strokeWidth={2.6} />
        </div>
        <div className="dash-spin" style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(201,168,76,0.25)', borderTopColor: '#c9a84c' }} />
      </div>
    );
  }

  return (
    <NotificationBadgesProvider>
      <MarketProvider>
        <div className="dash-root">
          <DashboardSidebar user={user} isOpen={sidebarOpen} onClose={closeSidebar} />

          <div className="dash-shell">
            <DashboardNavbar user={user} onMenuClick={() => setSidebarOpen(true)} />
            <MarketTicker />
            <main className="dash-main">{children}</main>
            <AuthSession />
            <DashboardFooter />
          </div>

          <BottomNav />
        </div>
      </MarketProvider>
    </NotificationBadgesProvider>
  );
}
