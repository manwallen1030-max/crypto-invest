'use client';

import { useState } from 'react';

// Real coin artwork (from CoinGecko). If an image ever fails to load we fall
// back to a clean monogram instead of a broken-image box.
export default function CoinLogo({ src, symbol = '?', size = 32 }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: '#1e1e35',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#e8c96a', fontWeight: 800, fontSize: Math.round(size * 0.38),
      }}>
        {symbol.slice(0, 1)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${symbol} logo`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
    />
  );
}
