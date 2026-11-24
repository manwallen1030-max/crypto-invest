'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/currency';
import { INVESTMENT_STATUS as STATUS_META } from '@/lib/statusMeta';
import StatusPill from '@/components/dashboard/StatusPill';

function daysRemaining(maturityDate) {
  if (!maturityDate) return null;
  const diff = new Date(maturityDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function maturityProgress(inv) {
  if (!inv.startDate || !inv.maturityDate) return 0;
  const start = new Date(inv.startDate).getTime();
  const end   = new Date(inv.maturityDate).getTime();
  const now   = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

export default function MyInvestmentsPage() {
  const pageRef = useRef(null);

  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useGSAP(() => {
    gsap.fromTo(
      pageRef.current?.querySelectorAll('.inv-section') || [],
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'power2.out' }
    );
  }, { scope: pageRef });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res  = await fetch('/api/user/investments', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) setInvestments(data.investments);
        else toast.error(data.error || 'Could not load your investments');
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

  // "My Investments" is the live portfolio: plans that are running or waiting
  // for approval. Finished and rejected ones live in Investment History.
  const current = investments.filter((i) => i.status === 'ACTIVE' || i.status === 'PENDING');

  return (
    <div ref={pageRef} style={{ maxWidth: 760 }}>

      <div className="inv-section" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{
            fontSize: 24, fontWeight: 800, color: '#f0f0fa',
            marginBottom: 4, letterSpacing: '-0.02em',
          }}>
            My Investments
          </h1>
          <p style={{ fontSize: 13.5, color: '#5a5a78' }}>
            Your active and pending investments. Completed and past ones are in Investment History.
          </p>
        </div>

        <Link href="/dashboard/investments/invest" style={{
          padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
          background: 'linear-gradient(135deg, #c9a84c, #a8722a)', color: '#0a0a0f',
          textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <i className="fas fa-plus"></i>
          New Investment
        </Link>
      </div>

      <div className="inv-section">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
            <i className="fas fa-spinner fa-spin" style={{ color: '#c9a84c' }}></i>
          </div>
        ) : current.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
          }}>
            <i className="fas fa-chart-line" style={{
              fontSize: 28, color: '#3a3a52',
              marginBottom: 12, display: 'block',
            }}></i>
            <div style={{ fontSize: 14, color: '#9898b8', marginBottom: 4 }}>
              No active investments
            </div>
            <div style={{ fontSize: 12, color: '#5a5a78' }}>
              Choose &quot;Invest Now&quot; to get started
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {current.map((inv) => {
              const progress  = maturityProgress(inv);
              const remaining = daysRemaining(inv.maturityDate);
              return (
                <div key={inv.id} style={{
                  background: 'linear-gradient(145deg, rgba(20,20,36,0.85), rgba(12,12,22,0.9))',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 14, padding: '18px',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Top accent */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, transparent, ${STATUS_META[inv.status]?.color || '#c9a84c'}, transparent)`,
                  }} />

                  {/* Header row */}
                  <div style={{
                    display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', gap: 12, marginBottom: 12,
                  }}>
                    <div>
                      <div style={{
                        fontSize: 15, fontWeight: 700,
                        color: '#f0f0fa', marginBottom: 3,
                      }}>
                        {inv.planName}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#5a5a78' }}>
                        Submitted {new Date(inv.createdAt).toLocaleDateString()}
                        {inv.txHash && (
                          <span style={{ marginLeft: 8, fontFamily: 'monospace' }}>
                            · {inv.txHash.slice(0, 12)}...
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusPill status={inv.status} meta={STATUS_META} />
                  </div>

                  {/* Progress bar — only for ACTIVE */}
                  {inv.status === 'ACTIVE' && inv.startDate && (
                    <>
                      <div style={{
                        height: 5,
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 4, overflow: 'hidden', marginBottom: 6,
                      }}>
                        <div style={{
                          height: '100%', width: `${progress}%`,
                          background: 'linear-gradient(90deg, #a8722a, #c9a84c)',
                          borderRadius: 4,
                        }} />
                      </div>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: 11, color: '#5a5a78', marginBottom: 12,
                      }}>
                        <span>{progress}% complete</span>
                        <span>{remaining} day{remaining === 1 ? '' : 's'} remaining</span>
                      </div>
                    </>
                  )}

                  {/* Stats row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 12,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div>
                      <div style={{
                        fontSize: 10, color: '#5a5a78',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        marginBottom: 3,
                      }}>
                        Amount Invested
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0fa' }}>
                        {formatCurrency(inv.amount)}
                      </div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: 10, color: '#5a5a78',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        marginBottom: 3,
                      }}>
                        Expected Profit
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>
                        +{formatCurrency(inv.expectedProfit)}
                      </div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: 10, color: '#5a5a78',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        marginBottom: 3,
                      }}>
                        {inv.status === 'COMPLETED' ? 'Paid Out' : 'Total Return'}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#c9a84c' }}>
                        {formatCurrency(
                          inv.status === 'COMPLETED'
                            ? inv.releasedAmount
                            : inv.expectedReturn
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pending message */}
                  {inv.status === 'PENDING' && (
                    <div style={{
                      marginTop: 12, padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(234,179,8,0.06)',
                      border: '1px solid rgba(234,179,8,0.15)',
                      fontSize: 12, color: '#9898b8',
                    }}>
                      <i className="fas fa-clock" style={{
                        color: '#eab308', marginRight: 8,
                      }}></i>
                      Waiting for admin approval.
                      This usually takes a few hours.
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
