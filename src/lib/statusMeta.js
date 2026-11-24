// Labels and colours for each record status, shared by the Overview, My
// Investments and History pages so a status always looks the same everywhere.

export const DEPOSIT_STATUS = {
  PENDING:  { label: 'Pending Review', color: '#eab308' },
  APPROVED: { label: 'Approved',       color: '#22c55e' },
  REJECTED: { label: 'Rejected',       color: '#ef4444' },
};

export const WITHDRAWAL_STATUS = {
  PENDING:    { label: 'Pending',    color: '#eab308' },
  PROCESSING: { label: 'Processing', color: '#818cf8' },
  APPROVED:   { label: 'Completed',  color: '#22c55e' },
  REJECTED:   { label: 'Rejected',   color: '#ef4444' },
};

export const INVESTMENT_STATUS = {
  PENDING:   { label: 'Pending Review', color: '#eab308' },
  ACTIVE:    { label: 'Active',         color: '#22c55e' },
  COMPLETED: { label: 'Completed',      color: '#818cf8' },
  REJECTED:  { label: 'Rejected',       color: '#ef4444' },
  CANCELLED: { label: 'Cancelled',      color: '#5a5a78' },
};
