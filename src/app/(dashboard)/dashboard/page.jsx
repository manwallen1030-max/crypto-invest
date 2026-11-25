'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  TrendingUp, ArrowDownToLine, ArrowUpFromLine, Trophy, Layers, ArrowRight,
  Receipt, Plus, Sprout, UserPlus, RotateCcw, SlidersHorizontal, ArrowDown, ArrowUp,
} from 'lucide-react';
import { refreshUser } from '@/lib/refreshUser';
import { formatCurrency } from '@/lib/currency';
import WalletCard, { useHideBalance } from '@/components/dashboard/WalletCard';
import MarketChart from '@/components/market/MarketChart';
import NewsFeed from '@/components/market/NewsFeed';

const TX_META = {
  DEPOSIT:             { label: 'Deposit',       icon: ArrowDown,         color: '#16c784' },
  WITHDRAWAL:          { label: 'Withdrawal',    icon: ArrowUp,           color: '#ea3943' },
  INVESTMENT:          { label: 'Investment',    icon: Sprout,            color: '#34b8a6' },
  PROFIT:              { label: 'Profit',        icon: TrendingUp,        color: '#c9a84c' },
  REFERRAL_COMMISSION: { label: 'Referral Bonus', icon: UserPlus,         color: '#f97316' },
  REFUND:              { label: 'Refund',        icon: RotateCcw,         color: '#eab308' },
  ADJUSTMENT:          { label: 'Adjustment',    icon: SlidersHorizontal, color: '#6a6a88' },
};

export default function DashboardPage() {
  const pageRef = useRef(null);
  const [hidden] = useHideBalance();
  const [user, setUser] = useState(null);
  const [txs, setTxs] = useState(null); // null = loading

  useEffect(() => {
    const apply = (u) => setUser(u);
    try {
      const stored = localStorage.getItem('vaultex_user');
      if (stored) apply(JSON.parse(stored));
    } catch {}

    // Replace the login-time copy with the real numbers from the server, now
    // and whenever the user returns to this tab.
    const sync = async () => {
      const fresh = await refreshUser();
      if (fresh) apply(fresh);
    };
    sync();
    window.addEventListener('focus', sync);
    return () => window.removeEventListener('focus', sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/transactions');
        const data = await res.json();
        if (!cancelled) setTxs(res.ok ? (data.transactions || []).slice(0, 5) : []);
      } catch {
        if (!cancelled) setTxs([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('.hero-wallet', { y: 40, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.8 })
      .fromTo('.stat-tile', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.08 }, 0.2)
      .fromTo('.quick-action', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.07 }, 0.45);
  }, { scope: pageRef });

  const val = (cents) => (hidden ? '••••' : formatCurrency(cents));

  const stats = [
    { label: 'Total Profit',       value: val(user?.totalProfit),    icon: Trophy,          color: '#16c784' },
    { label: 'Total Deposited',    value: val(user?.totalDeposited), icon: ArrowDownToLine, color: '#c9a84c' },
    { label: 'Active Investments', value: user?.activeInvestments ?? 0, icon: Layers,       color: '#34b8a6' },
    { label: 'Total Withdrawn',    value: val(user?.totalWithdrawn), icon: ArrowUpFromLine, color: '#f97316' },
  ];

  const actions = [
    { label: 'Deposit',  href: '/dashboard/deposit/new',        icon: ArrowDownToLine, color: '#16c784' },
    { label: 'Invest',   href: '/dashboard/investments/invest', icon: TrendingUp,      color: '#c9a84c' },
    { label: 'Withdraw', href: '/dashboard/withdraw/new',       icon: ArrowUpFromLine, color: '#34b8a6' },
  ];

  return (
    <div ref={pageRef} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Balance first: wallet card + key numbers */}
      <div className="home-hero">
        <div className="hero-wallet">
          <WalletCard
            showStats={false}
            user={user}
            balance={user?.balance || 0}
            profit={user?.totalProfit || 0}
            deposited={user?.totalDeposited || 0}
          />
        </div>

        <div className="home-stats">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="stat-tile">
                <div style={{
                  width: 36, height: 36, borderRadius: 10, marginBottom: 12, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: `${s.color}18`, border: `1px solid ${s.color}30`,
                }}>
                  <Icon size={17} color={s.color} />
                </div>
                <div style={{ fontSize: 11.5, color: '#6a6a88', fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 'clamp(16px, 4.4vw, 20px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {s.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="home-actions">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.href} href={a.href} className="quick-action" style={{ textDecoration: 'none' }}>
              <span style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${a.color}18`, border: `1px solid ${a.color}30`,
              }}>
                <Icon size={18} color={a.color} />
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#f0f0fa' }}>{a.label}</span>
              <ArrowRight size={15} color="#5a5a78" style={{ marginLeft: 'auto' }} />
            </Link>
          );
        })}
      </div>

      {/* Live chart + news */}
      <div className="home-market">
        <MarketChart />
        <NewsFeed limit={6} />
      </div>

      {/* Recent transactions */}
      <section data-reveal className="panel">
        <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0fa' }}>Recent Transactions</div>
          <Link href="/dashboard/transactions" style={{ fontSize: 12.5, color: '#c9a84c', textDecoration: 'none', fontWeight: 700 }}>
            View all
          </Link>
        </div>

        {txs === null ? (
          <div style={{ padding: 18 }}>
            {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 10 }} />)}
          </div>
        ) : txs.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
            }}>
              <Receipt size={22} color="#c9a84c" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0fa', marginBottom: 6 }}>No transactions yet</div>
            <div style={{ fontSize: 13, color: '#6a6a88', marginBottom: 20 }}>Make your first deposit to get started</div>
            <Link href="/dashboard/deposit/new" className="btn-solid"><Plus size={15} /> Make a deposit</Link>
          </div>
        ) : (
          txs.map((tx, i) => {
            const meta = TX_META[tx.type] || TX_META.ADJUSTMENT;
            const Icon = meta.icon;
            const positive = tx.amount >= 0;
            return (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px',
                borderBottom: i < txs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${meta.color}15`, border: `1px solid ${meta.color}30`,
                }}>
                  <Icon size={16} color={meta.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f0f0fa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tx.description || meta.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6a6a88', marginTop: 2 }}>{new Date(tx.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: positive ? '#16c784' : '#ea3943', fontVariantNumeric: 'tabular-nums' }}>
                  {hidden ? '••••' : `${positive ? '+' : ''}${formatCurrency(tx.amount)}`}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
