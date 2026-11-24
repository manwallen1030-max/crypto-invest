'use client';

// Small red count pill used in the sidebar, the navbar menu button and the
// overview quick-link cards. Renders nothing when there is nothing new.
export default function NotificationBadge({ count, style }) {
  if (!count) return null;
  const text = count > 99 ? '99+' : count;
  return (
    <span
      title={`${count} new update${count === 1 ? '' : 's'}`}
      aria-label={`${count} new update${count === 1 ? '' : 's'}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 18, height: 18, padding: '0 5px', borderRadius: 100,
        background: '#ef4444', color: '#fff',
        fontSize: 10, fontWeight: 800, lineHeight: 1,
        boxShadow: '0 0 8px rgba(239,68,68,0.5)',
        flexShrink: 0,
        ...style,
      }}
    >
      {text}
    </span>
  );
}
