'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';
import { PAYMENT_METHODS, calculateWithdrawalFee } from '@/lib/paymentMethods';
import { formatCurrency, dollarsToCents } from '@/lib/currency';
import { announceBadgeChange } from '@/lib/notificationBadges';

export default function WithdrawNowPage() {
  const pageRef = useRef(null);

  const [balance, setBalance] = useState(0);
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useGSAP(() => {
    gsap.fromTo(
      pageRef.current?.querySelectorAll('.withdraw-section') || [],
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
    );
  }, { scope: pageRef });

  useEffect(() => {
    (async () => {
      const stored = localStorage.getItem('vaultex_user');
      if (stored) setBalance(JSON.parse(stored).balance || 0);
    })();
  }, []);

  const amountCents = dollarsToCents(amount);
  const fee = method && amountCents > 0 ? calculateWithdrawalFee(amountCents, method) : 0;
  const netAmount = amountCents - fee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt < 10) newErrors.amount = 'Minimum withdrawal is $10.00';
    else if (dollarsToCents(amount) > balance) newErrors.amount = 'Amount exceeds your available balance';
    if (!method) newErrors.method = 'Please select a payment method';
    if (!walletAddress.trim()) newErrors.walletAddress = 'Destination address is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/user/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method, walletAddress }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else toast.error(data.error || 'Withdrawal failed');
        return;
      }

      toast.success('Withdrawal request submitted');
      setBalance(data.balance);
      // Keep the locally-cached user in sync so the dashboard/nav reflect
      // the new balance without needing a full reload.
      const stored = localStorage.getItem('vaultex_user');
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem('vaultex_user', JSON.stringify({ ...u, balance: data.balance }));
        window.dispatchEvent(new Event('vaultex:user-updated'));
      }
      setAmount(''); setMethod(''); setWalletAddress('');
      // The new request now shows in Withdrawal History; refresh the sidebar badge.
      announceBadgeChange();
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={pageRef} style={{ maxWidth: 640 }}>

      <div className="withdraw-section" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f0fa', marginBottom: 4, letterSpacing: '-0.02em' }}>
          Withdraw Funds
        </h1>
        <p style={{ fontSize: 13.5, color: '#5a5a78' }}>
          Available balance: <span style={{ color: '#c9a84c', fontWeight: 700 }}>{formatCurrency(balance)}</span>
        </p>
      </div>

      <div className="withdraw-section" style={{
        background: 'linear-gradient(145deg, rgba(20,20,36,0.85), rgba(12,12,22,0.9))',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: '26px', marginBottom: 20,
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#9898b8' }}>Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                {Object.entries(PAYMENT_METHODS).map(([key, m]) => (
                  <button
                    key={key} type="button"
                    onClick={() => { setMethod(key); setErrors((p) => ({ ...p, method: '' })); }}
                    style={{
                      padding: '12px 10px', borderRadius: 10, cursor: 'pointer',
                      background: method === key ? `${m.color}18` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${method === key ? `${m.color}60` : 'rgba(255,255,255,0.08)'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <i className={m.icon} style={{ fontSize: 16, color: method === key ? m.color : '#9898b8' }}></i>
                    <span style={{ fontSize: 11, fontWeight: 600, color: method === key ? m.color : '#9898b8' }}>
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
              {errors.method && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.method}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#9898b8' }}>Destination Address</label>
              <input
                value={walletAddress}
                onChange={(e) => { setWalletAddress(e.target.value); setErrors((p) => ({ ...p, walletAddress: '' })); }}
                placeholder="Wallet address to receive funds"
                style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${errors.walletAddress ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: '#f0f0fa', fontSize: 13.5, outline: 'none', fontFamily: 'monospace',
                }}
              />
              {errors.walletAddress && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.walletAddress}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#9898b8' }}>Amount (USD)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#5a5a78', fontSize: 14 }}>$</span>
                <input
                  type="number" min="10" step="0.01"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: '' })); }}
                  placeholder="0.00"
                  style={{
                    width: '100%', padding: '12px 14px 12px 28px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${errors.amount ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: '#f0f0fa', fontSize: 14, outline: 'none',
                  }}
                />
              </div>
              {errors.amount && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.amount}</span>}
            </div>

            {/* Live fee breakdown */}
            {method && amountCents > 0 && (
              <div style={{
                padding: '14px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#9898b8' }}>
                  <span>Amount</span><span>{formatCurrency(amountCents)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#9898b8' }}>
                  <span>Network fee</span><span>-{formatCurrency(fee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: '#c9a84c', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span>You&apos;ll receive</span><span>{formatCurrency(Math.max(netAmount, 0))}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: submitting ? 'rgba(201,168,76,0.4)' : 'linear-gradient(135deg, #c9a84c, #a8722a)',
                color: '#0a0a0f', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {submitting
                ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</>
                : <><i className="fas fa-paper-plane"></i> Request Withdrawal</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
