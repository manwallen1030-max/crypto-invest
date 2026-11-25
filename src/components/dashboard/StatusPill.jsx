'use client';

// Coloured status label. `meta` is one of the maps in src/lib/statusMeta.js.
export default function StatusPill({ status, meta }) {
  const m = meta[status] || { label: status, color: '#6a6a88' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color: m.color,
      background: `${m.color}18`, border: `1px solid ${m.color}35`,
      padding: '3px 10px', borderRadius: 100, whiteSpace: 'nowrap',
    }}>
      {m.label}
    </span>
  );
}
