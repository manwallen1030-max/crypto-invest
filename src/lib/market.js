'use client';

// Shared live-market state for the dashboard. One provider polls
// /api/market/overview so the ticker, chart header and wallet drawer all show
// the same prices without each making their own request.

import { createContext, useContext, useEffect, useState } from 'react';

const POLL_MS = 60 * 1000;
const MarketContext = createContext({ coins: [], loading: true, error: null });

export function useMarket() {
  return useContext(MarketContext);
}

export function MarketProvider({ children }) {
  const [state, setState] = useState({ coins: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/market/overview', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (data.coins?.length) setState({ coins: data.coins, loading: false, error: null });
        else setState((s) => ({ ...s, loading: false, error: data.error || 'Market data unavailable' }));
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: 'Market data unavailable' }));
      }
    };
    load();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return <MarketContext.Provider value={state}>{children}</MarketContext.Provider>;
}

export function formatUsd(v, opts = {}) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const abs = Math.abs(v);
  const digits = opts.digits ?? (abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6);
  return v.toLocaleString('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  });
}

export function formatPct(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `${Math.abs(v).toFixed(1)}%`;
}

export function timeAgo(unixSeconds) {
  if (!unixSeconds) return '';
  const s = Math.max(1, Math.floor(Date.now() / 1000 - unixSeconds));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
