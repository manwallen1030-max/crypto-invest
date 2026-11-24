'use client';

import HistoryShell from '@/components/dashboard/HistoryShell';
import StatusPill from '@/components/dashboard/StatusPill';
import { WITHDRAWAL_STATUS } from '@/lib/statusMeta';
import { PAYMENT_METHODS } from '@/lib/paymentMethods';
import { formatCurrency } from '@/lib/currency';

function shorten(value) {
  if (!value || value.length <= 22) return value;
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

function WithdrawalRow({ w }) {
  const method = PAYMENT_METHODS[w.method];
  const color = method?.color || '#9898b8';
  return (
    <>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${color}15`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={method?.icon || 'fas fa-coins'} style={{ fontSize: 14, color }}></i>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f0f0fa' }}>
          {formatCurrency(w.amount)}
          <span style={{ fontSize: 11.5, fontWeight: 500, color: '#5a5a78', marginLeft: 8 }}>
            you receive {formatCurrency(w.netAmount)} after {formatCurrency(w.networkFee)} fee
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: '#5a5a78', marginTop: 2 }}>
          {method?.label || w.method} · {new Date(w.createdAt).toLocaleString()}
        </div>
        <div style={{ fontSize: 11, color: '#5a5a78', marginTop: 2, fontFamily: 'monospace' }}>
          To: {shorten(w.walletAddress)}
        </div>
        {w.status === 'APPROVED' && w.txHash && (
          <div style={{ fontSize: 11, color: '#22c55e', marginTop: 4, fontFamily: 'monospace' }}>
            <i className="fas fa-circle-check" style={{ marginRight: 6 }}></i>TX: {shorten(w.txHash)}
          </div>
        )}
        {w.status === 'REJECTED' && (
          <div style={{ fontSize: 11.5, color: '#ef4444', marginTop: 4 }}>
            <i className="fas fa-circle-xmark" style={{ marginRight: 6 }}></i>
            {w.adminNote ? `${w.adminNote} · ` : ''}Refunded to your balance
          </div>
        )}
      </div>

      <StatusPill status={w.status} meta={WITHDRAWAL_STATUS} />
    </>
  );
}

export default function WithdrawalHistoryPage() {
  return (
    <HistoryShell
      title="Withdrawal History"
      subtitle="Every withdrawal you've requested and where it stands."
      badgeType="WITHDRAWAL"
      endpoint="/api/user/withdrawals"
      dataKey="withdrawals"
      statusMeta={WITHDRAWAL_STATUS}
      noun="withdrawals"
      icon="fas fa-circle-arrow-up"
      actionHref="/dashboard/withdraw/new"
      actionLabel="Withdraw Now"
      renderItem={(w) => <WithdrawalRow w={w} />}
    />
  );
}
