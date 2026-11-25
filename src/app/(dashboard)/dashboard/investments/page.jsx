'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/currency';
import { useBadges } from '@/lib/notificationBadges';
import {
  OverviewHeader, SectionTitle, StatGrid, StatCard, QuickLinkGrid, QuickLink,
} from '@/components/dashboard/OverviewParts';

export default function InvestmentsOverviewPage() {
  const pageRef = useRef(null);
  const badges = useBadges();

  const [investments, setInvestments] = useState([]);
  const [totalProfit, setTotalProfit] = useState(0);
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
        const [invRes, meRes] = await Promise.all([
          fetch('/api/user/investments', { cache: 'no-store' }),
          fetch('/api/user/me', { cache: 'no-store' }),
        ]);
        const inv = await invRes.json();
        const me = meRes.ok ? await meRes.json() : null;
        if (cancelled) return;
        if (invRes.ok) setInvestments(inv.investments);
        else toast.error(inv.error || 'Could not load your investments');
        if (me?.user) setTotalProfit(me.user.totalProfit || 0);
      } catch {
        if (!cancelled) toast.error('Network error loading your investments');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    window.addEventListener('focus', load);
    return () => { cancelled = true; window.removeEventListener('focus', load); };
  }, []);

  const active    = investments.filter((i) => i.status === 'ACTIVE');
  const pending   = investments.filter((i) => i.status === 'PENDING');
  const completed = investments.filter((i) => i.status === 'COMPLETED');
  const sum = (list, key) => list.reduce((t, i) => t + (i[key] || 0), 0);
  const show = (v) => (loading ? '—' : v);

  return (
    <div ref={pageRef}>
      <OverviewHeader
        title="Investments"
        subtitle="A summary of your investment activity and returns."
        actionHref="/dashboard/investments/invest"
        actionLabel="Invest Now"
      />

      <StatGrid>
        <StatCard
          label="Total Invested" icon="fas fa-sack-dollar" color="#c9a84c"
          value={show(formatCurrency(sum([...active, ...completed], 'amount')))}
          sub={show(`${active.length + completed.length} approved investment${active.length + completed.length === 1 ? '' : 's'}`)}
        />
        <StatCard
          label="Active Investments" icon="fas fa-chart-line" color="#16c784"
          value={show(active.length)}
          sub={show(`${formatCurrency(sum(active, 'amount'))} working for you`)}
        />
        <StatCard
          label="Pending Approval" icon="fas fa-clock" color="#eab308"
          value={show(pending.length)}
          sub={show(`${formatCurrency(sum(pending, 'amount'))} awaiting review`)}
        />
        <StatCard
          label="Expected Returns" icon="fas fa-bullseye" color="#34b8a6"
          value={show(formatCurrency(sum(active, 'expectedReturn')))}
          sub="From active investments"
        />
        <StatCard
          label="Completed" icon="fas fa-circle-check" color="#34b8a6"
          value={show(completed.length)}
          sub={show(`${formatCurrency(sum(completed, 'releasedAmount'))} paid out`)}
        />
        <StatCard
          label="Total Profit" icon="fas fa-trophy" color="#f97316"
          value={show(formatCurrency(totalProfit))}
          sub="Earned to date"
        />
      </StatGrid>

      <SectionTitle>Quick Links</SectionTitle>
      <QuickLinkGrid>
        <QuickLink
          href="/dashboard/investments/invest" label="Invest Now" desc="Choose a plan and start earning"
          icon="fas fa-circle-plus" color="#c9a84c"
        />
        <QuickLink
          href="/dashboard/investments/my" label="My Investments" desc="Your active and pending plans"
          icon="fas fa-briefcase" color="#16c784"
        />
        <QuickLink
          href="/dashboard/investments/history" label="Investment History" desc="Every investment, start to finish"
          icon="fas fa-clock-rotate-left" color="#34b8a6" badge={badges.INVESTMENT}
        />
      </QuickLinkGrid>
    </div>
  );
}
