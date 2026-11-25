'use client';


import FaIcon from '@/components/ui/FaIcon';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';
import { formatCurrency, dollarsToCents } from '@/lib/currency';
import { refreshUser } from '@/lib/refreshUser';
import { announceBadgeChange } from '@/lib/notificationBadges';

export default function InvestNowPage() {
  const pageRef = useRef(null);

  const [plans,        setPlans]        = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [balance,      setBalance]      = useState(0);

  // Form state
  const [selectedPlan, setSelectedPlan] = useState('');
  const [amount,       setAmount]       = useState('');
  const [errors,       setErrors]       = useState({});
  const [submitting,   setSubmitting]   = useState(false);

  // Calculated preview
  const plan        = plans.find((p) => p.id === selectedPlan);
  const amountCents = dollarsToCents(amount);
  const expProfit   = plan && amountCents > 0 ? Math.round(amountCents * (plan.rate / 100)) : 0;
  const expReturn   = amountCents + expProfit;

  useGSAP(() => {
    gsap.fromTo(
      pageRef.current?.querySelectorAll('.inv-section') || [],
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'power2.out' }
    );
  }, { scope: pageRef });

  // Load plans
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/investment-plans');
        const data = await res.json();
        if (res.ok) setPlans(data.plans);
      } finally {
        setLoadingPlans(false);
      }
    })();
  }, []);

  // Available balance: show the saved copy straight away, then the real number.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = localStorage.getItem('vaultex_user');
        if (stored && !cancelled) setBalance(JSON.parse(stored).balance || 0);
      } catch {}
      const fresh = await refreshUser();
      if (fresh && !cancelled) setBalance(fresh.balance || 0);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!selectedPlan) newErrors.planId = 'Please select a plan';
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Enter the amount you want to invest';
    }

    if (plan && !newErrors.amount) {
      if (amountCents < plan.minAmount) {
        newErrors.amount = `Minimum for this plan is ${formatCurrency(plan.minAmount)}`;
      } else if (plan.maxAmount && amountCents > plan.maxAmount) {
        newErrors.amount = `Maximum for this plan is ${formatCurrency(plan.maxAmount)}`;
      }
    }
    if (!newErrors.amount && amountCents > balance) {
      newErrors.amount = 'Amount exceeds your available balance';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/user/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, amount }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else toast.error(data.error || 'Submission failed');
        return;
      }

      toast.success('Investment request submitted! Admin will confirm shortly.');

      // The amount left the balance when the request was made; keep the cached
      // user in sync so the dashboard and this page show the new balance.
      if (typeof data.newBalance === 'number') {
        setBalance(data.newBalance);
        try {
          const stored = localStorage.getItem('vaultex_user');
          if (stored) {
            const u = JSON.parse(stored);
            localStorage.setItem('vaultex_user', JSON.stringify({ ...u, balance: data.newBalance }));
            window.dispatchEvent(new Event('vaultex:user-updated'));
          }
        } catch {}
      }

      setSelectedPlan(''); setAmount(''); setErrors({});
      // The new request now shows in Investment History; refresh the sidebar badge.
      announceBadgeChange();
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={pageRef} style={{ maxWidth: 760 }}>

      {/* Header */}
      <div className="inv-section" style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 24, fontWeight: 800, color: '#f0f0fa',
          marginBottom: 4, letterSpacing: '-0.02em',
        }}>
          Invest Now
        </h1>
        <p style={{ fontSize: 13.5, color: '#6a6a88' }}>
          Available balance:{' '}
          <span style={{ color: '#c9a84c', fontWeight: 700 }}>{formatCurrency(balance)}</span>
          {balance <= 0 && (
            <>
              {' '}·{' '}
              <Link href="/dashboard/deposit/new" style={{ color: '#c9a84c', textDecoration: 'none', fontWeight: 600 }}>
                Make a deposit first
              </Link>
            </>
          )}
        </p>
      </div>

      {/* Investment Form */}
      <div className="inv-section" style={{
        background: '#13131f',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 16, padding: '28px',
        marginBottom: 24, position: 'relative', overflow: 'hidden',
      }}>
        {/* Top accent */}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0fa', marginBottom: 20 }}>
          Submit Investment Request
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Step 1 — Pick plan */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#9898b8' }}>
                Step 1 — Choose a Plan
              </label>
              {loadingPlans ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                  <FaIcon className="fas fa-spinner fa-spin" style={{ color: '#c9a84c' }} />
                </div>
              ) : plans.length === 0 ? (
                <div style={{ fontSize: 13, color: '#9898b8', padding: '8px 0' }}>
                  No investment plans are available right now.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 10,
                }}>
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlan(p.id);
                        setErrors((prev) => ({ ...prev, planId: '', amount: '' }));
                      }}
                      style={{
                        padding: '14px 12px', borderRadius: 12,
                        textAlign: 'left', cursor: 'pointer',
                        background: selectedPlan === p.id
                          ? 'rgba(201,168,76,0.12)'
                          : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selectedPlan === p.id
                          ? 'rgba(201,168,76,0.4)'
                          : 'rgba(255,255,255,0.08)'}`,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: selectedPlan === p.id ? '#c9a84c' : '#f0f0fa',
                        marginBottom: 4,
                      }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#c9a84c', marginBottom: 2 }}>
                        {p.rate}%
                      </div>
                      <div style={{ fontSize: 11, color: '#6a6a88' }}>
                        {p.duration} days · Min {formatCurrency(p.minAmount)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {errors.planId && (
                <span style={{ fontSize: 12, color: '#ea3943' }}>{errors.planId}</span>
              )}
            </div>

            {/* Step 2 — Amount */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#9898b8' }}>
                Step 2 — Amount to Invest (USD)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6a6a88', fontSize: 14,
                }}>$</span>
                <input
                  type="number" min="1" step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  placeholder="0.00"
                  style={{
                    width: '100%', padding: '12px 14px 12px 28px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${errors.amount
                      ? 'rgba(234,57,67,0.5)'
                      : 'rgba(255,255,255,0.08)'}`,
                    color: '#f0f0fa', fontSize: 14, outline: 'none',
                  }}
                />
              </div>
              {errors.amount && (
                <span style={{ fontSize: 12, color: '#ea3943' }}>{errors.amount}</span>
              )}
              {plan && (
                <span style={{ fontSize: 11.5, color: '#6a6a88' }}>
                  This plan accepts {formatCurrency(plan.minAmount)}
                  {plan.maxAmount ? ` to ${formatCurrency(plan.maxAmount)}` : ' and above'}.
                </span>
              )}

              {/* Live profit preview */}
              {plan && amountCents > 0 && (
                <div style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', flexDirection: 'column', gap: 6,
                  marginTop: 4,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9898b8' }}>
                    <span>Plan</span>
                    <span style={{ color: '#f0f0fa' }}>{plan.name} ({plan.rate}%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9898b8' }}>
                    <span>Expected profit</span>
                    <span style={{ color: '#16c784', fontWeight: 700 }}>
                      +{formatCurrency(expProfit)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 13, color: '#c9a84c', fontWeight: 700,
                    paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span>Total at maturity</span>
                    <span>{formatCurrency(expReturn)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6a6a88' }}>
                    <span>Duration</span>
                    <span>{plan.duration} days</span>
                  </div>
                </div>
              )}
            </div>

            {/* Info box */}
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: 'rgba(52,184,166,0.06)',
              border: '1px solid rgba(52,184,166,0.15)',
              fontSize: 12.5, color: '#9898b8', lineHeight: 1.6,
            }}>
              <FaIcon className="fas fa-circle-info" style={{ color: '#34b8a6', marginRight: 8 }} />
              The amount is taken from your available balance when you submit. Admin will
              review and activate your investment, usually within a few hours. If it is
              rejected, the amount is returned to your balance.
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '14px', borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                background: submitting
                  ? 'rgba(201,168,76,0.4)'
                  : 'linear-gradient(135deg, #c9a84c, #a8722a)',
                color: '#0a0a0f', border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                transition: 'all 0.2s ease',
                boxShadow: submitting ? 'none' : '0 4px 20px rgba(201,168,76,0.25)',
              }}
            >
              {submitting
                ? <><FaIcon className="fas fa-spinner fa-spin" /> Submitting...</>
                : <><FaIcon className="fas fa-paper-plane" /> Submit Investment Request</>}
            </button>

          </div>
        </form>
      </div>

    </div>
  );
}
