// Labels and colours for each record status, shared by the Overview, My
// Investments and History pages so a status always looks the same everywhere.

export const DEPOSIT_STATUS = {
  PENDING:  { label: 'Pending Review', color: '#eab308' },
  APPROVED: { label: 'Approved',       color: '#16c784' },
  REJECTED: { label: 'Rejected',       color: '#ea3943' },
};

export const WITHDRAWAL_STATUS = {
  PENDING:    { label: 'Pending',    color: '#eab308' },
  PROCESSING: { label: 'Processing', color: '#34b8a6' },
  APPROVED:   { label: 'Completed',  color: '#16c784' },
  REJECTED:   { label: 'Rejected',   color: '#ea3943' },
};

export const INVESTMENT_STATUS = {
  PENDING:   { label: 'Pending Review', color: '#eab308' },
  ACTIVE:    { label: 'Active',         color: '#16c784' },
  COMPLETED: { label: 'Completed',      color: '#34b8a6' },
  REJECTED:  { label: 'Rejected',       color: '#ea3943' },
  CANCELLED: { label: 'Cancelled',      color: '#6a6a88' },
};
