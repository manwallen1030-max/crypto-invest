'use client';

import HistoryShell from '@/components/dashboard/HistoryShell';
import StatusPill from '@/components/dashboard/StatusPill';
import { DEPOSIT_STATUS } from '@/lib/statusMeta';
import { PAYMENT_METHODS } from '@/lib/paymentMethods';
import { formatCurrency } from '@/lib/currency';

function DepositRow({ d }) {
  const method = PAYMENT_METHODS[d.method];
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
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f0f0fa' }}>{formatCurrency(d.amount)}</div>
        <div style={{ fontSize: 11.5, color: '#5a5a78', marginTop: 2 }}>
          {method?.label || d.method} · {new Date(d.createdAt).toLocaleString()}
        </div>
        {d.txHash && (
          <div style={{
            fontSize: 11, color: '#5a5a78', marginTop: 2, fontFamily: 'monospace',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            Ref: {d.txHash}
          </div>
        )}
        {d.status === 'REJECTED' && d.adminNote && (
          <div style={{ fontSize: 11.5, color: '#ef4444', marginTop: 4 }}>
            <i className="fas fa-circle-xmark" style={{ marginRight: 6 }}></i>{d.adminNote}
          </div>
        )}
        {d.status === 'APPROVED' && d.approvedAt && (
          <div style={{ fontSize: 11.5, color: '#22c55e', marginTop: 4 }}>
            <i className="fas fa-circle-check" style={{ marginRight: 6 }}></i>
            Credited {new Date(d.approvedAt).toLocaleString()}
          </div>
        )}
      </div>

      <StatusPill status={d.status} meta={DEPOSIT_STATUS} />
    </>
  );
}

export default function DepositHistoryPage() {
  return (
    <HistoryShell
      title="Deposit History"
      subtitle="Every deposit you've submitted and where it stands."
      badgeType="DEPOSIT"
      endpoint="/api/user/deposits"
      dataKey="deposits"
      statusMeta={DEPOSIT_STATUS}
      noun="deposits"
      icon="fas fa-circle-arrow-down"
      actionHref="/dashboard/deposit/new"
      actionLabel="Deposit Now"
      renderItem={(d) => <DepositRow d={d} />}
    />
  );
}
