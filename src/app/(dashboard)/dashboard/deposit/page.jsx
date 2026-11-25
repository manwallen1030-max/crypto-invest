'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/currency';
import { useBadges } from '@/lib/notificationBadges';
import {
  OverviewHeader, SectionTitle, StatGrid, StatCard, QuickLinkGrid, QuickLink,
} from '@/components/dashboard/OverviewParts';

export default function DepositOverviewPage() {
  const pageRef = useRef(null);
  const router = useRouter();
  const badges = useBadges();

  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  useGSAP(() => {
    gsap.fromTo(
      pageRef.current?.querySelectorAll('.ov-section') || [],
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
    );
  }, { scope: pageRef });

  // Coming back from Paystack lands here (the gateway's callback URL points at
  // /dashboard/deposit). Show the same message as before, then take the user
  // to Deposit History where the payment appears and updates.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paystack_success') === 'true') {
      toast.success('Payment completed! Verifying...');
      router.replace('/dashboard/deposit/history');
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/user/deposits', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) setDeposits(data.deposits);
        else toast.error(data.error || 'Could not load your deposits');
      } catch {
        if (!cancelled) toast.error('Network error loading your deposits');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    window.addEventListener('focus', load);
    return () => { cancelled = true; window.removeEventListener('focus', load); };
  }, []);

  const approved = deposits.filter((d) => d.status === 'APPROVED');
  const pending  = deposits.filter((d) => d.status === 'PENDING');
  const rejected = deposits.filter((d) => d.status === 'REJECTED');
  const sum = (list) => list.reduce((t, d) => t + (d.amount || 0), 0);
  const show = (v) => (loading ? '—' : v);

  return (
    <div ref={pageRef}>
      <OverviewHeader
        title="Deposits"
        subtitle="A summary of the money you've added to your account."
        actionHref="/dashboard/deposit/new"
        actionLabel="Deposit Now"
      />

      <StatGrid>
        <StatCard
          label="Total Deposited" icon="fas fa-circle-arrow-down" color="#16c784"
          value={show(formatCurrency(sum(approved)))}
          sub={show(`${approved.length} approved deposit${approved.length === 1 ? '' : 's'}`)}
        />
        <StatCard
          label="Pending Deposits" icon="fas fa-clock" color="#eab308"
          value={show(formatCurrency(sum(pending)))}
          sub={show(`${pending.length} awaiting review`)}
        />
        <StatCard
          label="Rejected Deposits" icon="fas fa-circle-xmark" color="#ea3943"
          value={show(rejected.length)}
          sub={show(formatCurrency(sum(rejected)))}
        />
        <StatCard
          label="All Deposit Requests" icon="fas fa-receipt" color="#34b8a6"
          value={show(deposits.length)}
          sub="Since you joined"
        />
      </StatGrid>

      <SectionTitle>Quick Links</SectionTitle>
      <QuickLinkGrid>
        <QuickLink
          href="/dashboard/deposit/new" label="Deposit Now" desc="Fund your account"
          icon="fas fa-circle-plus" color="#16c784"
        />
        <QuickLink
          href="/dashboard/deposit/history" label="Deposit History" desc="Track every deposit"
          icon="fas fa-clock-rotate-left" color="#c9a84c" badge={badges.DEPOSIT}
        />
      </QuickLinkGrid>
    </div>
  );
}
