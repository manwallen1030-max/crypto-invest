'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/currency';
import { refreshUser } from '@/lib/refreshUser';
import { useBadges } from '@/lib/notificationBadges';
import {
  OverviewHeader, SectionTitle, StatGrid, StatCard, QuickLinkGrid, QuickLink,
} from '@/components/dashboard/OverviewParts';

export default function WithdrawOverviewPage() {
  const pageRef = useRef(null);
  const badges = useBadges();

  const [withdrawals, setWithdrawals] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useGSAP(() => {
    gsap.fromTo(
      pageRef.current?.querySelectorAll('.ov-section') || [],
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
    );
  }, { scope: pageRef });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [res, fresh] = await Promise.all([
          fetch('/api/user/withdrawals', { cache: 'no-store' }),
          refreshUser(),
        ]);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) setWithdrawals(data.withdrawals);
        else toast.error(data.error || 'Could not load your withdrawals');
        if (fresh) setBalance(fresh.balance || 0);
      } catch {
        if (!cancelled) toast.error('Network error loading your withdrawals');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    window.addEventListener('focus', load);
    return () => { cancelled = true; window.removeEventListener('focus', load); };
  }, []);

  const completed = withdrawals.filter((w) => w.status === 'APPROVED');
  const pending   = withdrawals.filter((w) => w.status === 'PENDING' || w.status === 'PROCESSING');
  const rejected  = withdrawals.filter((w) => w.status === 'REJECTED');
  const sum = (list, key) => list.reduce((t, w) => t + (w[key] || 0), 0);
  const show = (v) => (loading ? '—' : v);

  return (
    <div ref={pageRef}>
      <OverviewHeader
        title="Withdrawals"
        subtitle={`Available balance: ${formatCurrency(balance)}`}
        actionHref="/dashboard/withdraw/new"
        actionLabel="Withdraw Now"
      />

      <StatGrid>
        <StatCard
          label="Total Withdrawn" icon="fas fa-circle-arrow-up" color="#34b8a6"
          value={show(formatCurrency(sum(completed, 'amount')))}
          sub={show(`${formatCurrency(sum(completed, 'netAmount'))} received after fees`)}
        />
        <StatCard
          label="Pending Withdrawals" icon="fas fa-clock" color="#eab308"
          value={show(formatCurrency(sum(pending, 'amount')))}
          sub={show(`${pending.length} awaiting processing`)}
        />
        <StatCard
          label="Completed Withdrawals" icon="fas fa-circle-check" color="#16c784"
          value={show(completed.length)}
          sub="Sent to your wallet"
        />
        <StatCard
          label="Rejected Withdrawals" icon="fas fa-circle-xmark" color="#ea3943"
          value={show(rejected.length)}
          sub={show(`${formatCurrency(sum(rejected, 'amount'))} refunded`)}
        />
      </StatGrid>

      <SectionTitle>Quick Links</SectionTitle>
      <QuickLinkGrid>
        <QuickLink
          href="/dashboard/withdraw/new" label="Withdraw Now" desc="Cash out anytime"
          icon="fas fa-circle-plus" color="#34b8a6"
        />
        <QuickLink
          href="/dashboard/withdraw/history" label="Withdrawal History" desc="Track every withdrawal"
          icon="fas fa-clock-rotate-left" color="#c9a84c" badge={badges.WITHDRAWAL}
        />
      </QuickLinkGrid>
    </div>
  );
}
