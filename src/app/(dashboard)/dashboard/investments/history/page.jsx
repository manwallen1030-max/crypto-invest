'use client';


import FaIcon from '@/components/ui/FaIcon';
import HistoryShell from '@/components/dashboard/HistoryShell';
import StatusPill from '@/components/dashboard/StatusPill';
import { INVESTMENT_STATUS } from '@/lib/statusMeta';
import { formatCurrency } from '@/lib/currency';

function InvestmentRow({ inv }) {
  const color = INVESTMENT_STATUS[inv.status]?.color || '#6a6a88';
  return (
    <>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${color}15`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FaIcon className="fas fa-seedling" style={{ fontSize: 14, color }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f0f0fa' }}>
          {inv.planName}
          <span style={{ fontSize: 12, fontWeight: 700, color: '#c9a84c', marginLeft: 8 }}>
            {formatCurrency(inv.amount)}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: '#6a6a88', marginTop: 2 }}>
          Submitted {new Date(inv.createdAt).toLocaleString()}
        </div>
        <div style={{ fontSize: 11.5, color: '#6a6a88', marginTop: 2 }}>
          Expected return {formatCurrency(inv.expectedReturn)}
          <span style={{ color: '#16c784' }}> (+{formatCurrency(inv.expectedProfit)})</span>
        </div>
        {inv.startDate && inv.maturityDate && (
          <div style={{ fontSize: 11.5, color: '#6a6a88', marginTop: 2 }}>
            {new Date(inv.startDate).toLocaleDateString()} → {new Date(inv.maturityDate).toLocaleDateString()}
          </div>
        )}
        {inv.status === 'COMPLETED' && (
          <div style={{ fontSize: 11.5, color: '#34b8a6', marginTop: 4 }}>
            <FaIcon className="fas fa-circle-check" style={{ marginRight: 6 }} />
            Paid out {formatCurrency(inv.releasedAmount)}
          </div>
        )}
        {inv.status === 'REJECTED' && inv.adminNote && (
          <div style={{ fontSize: 11.5, color: '#ea3943', marginTop: 4 }}>
            <FaIcon className="fas fa-circle-xmark" style={{ marginRight: 6 }} />{inv.adminNote}
          </div>
        )}
      </div>

      <StatusPill status={inv.status} meta={INVESTMENT_STATUS} />
    </>
  );
}

export default function InvestmentHistoryPage() {
  return (
    <HistoryShell
      title="Investment History"
      subtitle="Every investment you've made, from request to payout."
      badgeType="INVESTMENT"
      endpoint="/api/user/investments"
      dataKey="investments"
      statusMeta={INVESTMENT_STATUS}
      noun="investments"
      icon="fas fa-chart-line"
      actionHref="/dashboard/investments/invest"
      actionLabel="Invest Now"
      renderItem={(inv) => <InvestmentRow inv={inv} />}
    />
  );
}
