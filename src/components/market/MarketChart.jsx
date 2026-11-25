'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useMarket, formatUsd, formatPct } from '@/lib/market';
import CoinLogo from './CoinLogo';

const RANGES = [
  { key: '1',   label: '24H' },
  { key: '7',   label: '7D' },
  { key: '30',  label: '1M' },
  { key: '90',  label: '3M' },
  { key: '365', label: '1Y' },
];

const STRIP = [
  { key: '24h', label: '24H' },
  { key: '7d',  label: '7D' },
  { key: '14d', label: '14D' },
  { key: '30d', label: '30D' },
  { key: '200d', label: '200D' },
  { key: '1y',  label: '1Y' },
];

const UP = '#16c784';
const DOWN = '#ea3943';
const PAD = { top: 14, right: 64, bottom: 26, left: 8 };

function fmtAxisTime(ts, range) {
  const d = new Date(ts);
  if (range === '1') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (range === '365') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTooltipTime(ts, range) {
  const d = new Date(ts);
  if (range === '1' || range === '7') {
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MarketChart() {
  const { coins } = useMarket();
  const uid = useId().replace(/:/g, '');
  const wrapRef = useRef(null);
  const lineRef = useRef(null);
  const areaRef = useRef(null);
  const priceRef = useRef(null);
  const tweenVal = useRef({ v: 0 });

  const [coinId, setCoinId] = useState('bitcoin');
  const [range, setRange] = useState('1');
  const [series, setSeries] = useState({ key: '', prices: [] });
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState(null);
  const [nonce, setNonce] = useState(0);

  const coin = coins.find((c) => c.id === coinId);
  const height = width && width < 520 ? 240 : 320;

  /* ── load history (cancel stale responses when coin / range changes) ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/market/chart?id=${coinId}&days=${range}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.prices?.length > 1) {
          setSeries({ key: `${coinId}-${range}-${Date.now()}`, prices: data.prices });
          setStatus('ok');
        } else {
          setStatus('error');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [coinId, range, nonce]);

  const retry = () => { setStatus('loading'); setNonce((n) => n + 1); };
  const pickCoin = (id) => { if (id !== coinId) { setStatus('loading'); setCoinId(id); } setHover(null); };
  const pickRange = (r) => { if (r !== range) { setStatus('loading'); setRange(r); } setHover(null); };

  /* ── measure ── */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── geometry ── */
  const geo = useMemo(() => {
    const pts = series.prices;
    if (!width || pts.length < 2) return null;
    const innerW = width - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    let min = Infinity, max = -Infinity;
    for (const [, p] of pts) { if (p < min) min = p; if (p > max) max = p; }
    const span = max - min || max * 0.01 || 1;
    min -= span * 0.08; max += span * 0.08;
    const x = (i) => PAD.left + (i / (pts.length - 1)) * innerW;
    const y = (p) => PAD.top + (1 - (p - min) / (max - min)) * innerH;
    const line = pts.map(([, p], i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join('');
    const area = `${line}L${x(pts.length - 1).toFixed(1)},${PAD.top + innerH}L${x(0).toFixed(1)},${PAD.top + innerH}Z`;
    const grid = [0, 1, 2, 3, 4].map((i) => {
      const val = max - ((max - min) * i) / 4;
      return { y: y(val), label: formatUsd(val, { digits: val >= 100 ? 0 : val >= 1 ? 2 : 4 }) };
    });
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
      const i = Math.round(f * (pts.length - 1));
      return { x: x(i), label: fmtAxisTime(pts[i][0], range), anchor: f === 0 ? 'start' : f === 1 ? 'end' : 'middle' };
    });
    const first = pts[0][1];
    const last = pts[pts.length - 1][1];
    return { x, y, line, area, grid, ticks, innerW, innerH, first, last, up: last >= first };
  }, [series, width, height, range]);

  const color = geo ? (geo.up ? UP : DOWN) : UP;
  const rangeChange = geo ? ((geo.last - geo.first) / geo.first) * 100 : null;

  /* ── GSAP: draw the line in whenever fresh data arrives ── */
  useGSAP(() => {
    const path = lineRef.current;
    const area = areaRef.current;
    if (!path || !area || !geo) return;
    const len = path.getTotalLength();
    gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, {
      strokeDashoffset: 0, duration: 1.1, ease: 'power3.out',
      onComplete: () => { path.style.strokeDasharray = 'none'; },
    });
    gsap.fromTo(area, { opacity: 0 }, { opacity: 1, duration: 1.1, delay: 0.15, ease: 'power2.out' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, { dependencies: [series.key], scope: wrapRef });

  /* ── GSAP: count the headline price to its new value ── */
  useEffect(() => {
    const el = priceRef.current;
    if (!el || !coin?.price) return;
    const tw = gsap.to(tweenVal.current, {
      v: coin.price, duration: 0.9, ease: 'power2.out',
      onUpdate: () => { el.textContent = formatUsd(tweenVal.current.v); },
    });
    return () => tw.kill();
  }, [coin?.price, coinId]);

  /* ── crosshair ── */
  const onMove = (e) => {
    if (!geo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const f = Math.min(1, Math.max(0, (px - PAD.left) / geo.innerW));
    const idx = Math.round(f * (series.prices.length - 1));
    setHover(idx);
  };

  const hp = hover !== null && geo ? series.prices[hover] : null;
  const hx = hp ? geo.x(hover) : 0;
  const hy = hp ? geo.y(hp[1]) : 0;
  const tipLeft = hp ? Math.min(Math.max(hx - 70, 4), width - 144) : 0;

  const dayChange = coin?.changes?.['24h'];
  const dayUp = (dayChange ?? 0) >= 0;
  const DayIcon = dayUp ? TrendingUp : TrendingDown;

  return (
    <section data-reveal style={{
      background: '#13131f',
      border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflow: 'hidden',
    }}>
      {/* coin picker */}
      <div style={{
        display: 'flex', gap: 8, padding: '14px 14px 0', overflowX: 'auto',
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
      }} className="no-scrollbar">
        {coins.length === 0 && <span style={{ fontSize: 12, color: '#6a6a88', padding: '6px 4px' }}>Loading markets…</span>}
        {coins.map((c) => {
          const active = c.id === coinId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => pickCoin(c.id)}
              aria-pressed={active}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0,
                padding: '6px 12px 6px 7px', borderRadius: 100, cursor: 'pointer',
                fontSize: 12.5, fontWeight: 700,
                color: active ? '#fff' : '#9898b8',
                background: active ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.06)'}`,
                transition: 'all .2s ease',
              }}
            >
              <CoinLogo src={c.image} symbol={c.symbol} size={20} />
              {c.symbol}
            </button>
          );
        })}
      </div>

      {/* headline */}
      <div style={{ padding: '18px 18px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <CoinLogo src={coin?.image} symbol={coin?.symbol || 'B'} size={30} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f0fa', lineHeight: 1.1 }}>{coin?.symbol || '—'}</div>
            <div style={{ fontSize: 12, color: '#6a6a88' }}>{coin?.name || 'Loading'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span ref={priceRef} style={{
            fontSize: 'clamp(30px, 8vw, 40px)', fontWeight: 800, color: '#fff',
            letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
          }}>
            {coin ? formatUsd(coin.price) : '—'}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700,
            color: dayUp ? UP : DOWN,
          }}>
            <DayIcon size={15} strokeWidth={2.6} /> {formatPct(dayChange)}
            <span style={{ color: '#6a6a88', fontWeight: 500, fontSize: 12 }}>24h</span>
          </span>
        </div>
      </div>

      {/* range tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 0', gap: 10 }}>
        <div role="tablist" aria-label="Chart range" style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 3 }}>
          {RANGES.map((r) => {
            const active = r.key === range;
            return (
              <button
                key={r.key}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => pickRange(r.key)}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 12.5, fontWeight: 700,
                  color: active ? '#fff' : '#9898b8',
                  background: active ? 'rgba(201,168,76,0.22)' : 'transparent',
                  transition: 'all .2s ease',
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
        {rangeChange !== null && (
          <span style={{ fontSize: 12, fontWeight: 700, color: geo.up ? UP : DOWN, fontVariantNumeric: 'tabular-nums' }}>
            {geo.up ? '+' : '−'}{Math.abs(rangeChange).toFixed(2)}%
          </span>
        )}
      </div>

      {/* chart */}
      <div ref={wrapRef} style={{ position: 'relative', height, marginTop: 6, touchAction: 'pan-y' }}>
        {geo && (
          <svg
            width={width} height={height} viewBox={`0 0 ${width} ${height}`}
            style={{ display: 'block', opacity: status === 'loading' ? 0.45 : 1, transition: 'opacity .25s ease' }}
            role="img" aria-label={`${coin?.name || 'Coin'} price chart`}
          >
            <defs>
              <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.32" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {geo.grid.map((g, i) => (
              <g key={i}>
                <line x1={PAD.left} x2={width - PAD.right + 6} y1={g.y} y2={g.y} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4" />
                <text x={width - PAD.right + 10} y={g.y + 3.5} fontSize="10" fill="#6a6a88" style={{ fontVariantNumeric: 'tabular-nums' }}>{g.label}</text>
              </g>
            ))}
            {geo.ticks.map((t, i) => (
              <text key={i} x={t.x} y={height - 8} fontSize="10" fill="#6a6a88" textAnchor={t.anchor}>{t.label}</text>
            ))}

            <path ref={areaRef} d={geo.area} fill={`url(#fill-${uid})`} />
            <path ref={lineRef} d={geo.line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {/* latest price marker */}
            <line x1={PAD.left} x2={width - PAD.right + 6} y1={geo.y(geo.last)} y2={geo.y(geo.last)} stroke={color} strokeOpacity="0.45" strokeDasharray="3 3" />
            <rect x={width - PAD.right + 6} y={geo.y(geo.last) - 9} width={PAD.right - 8} height="18" rx="4" fill={color} />
            <text x={width - PAD.right + 6 + (PAD.right - 8) / 2} y={geo.y(geo.last) + 3.5} fontSize="10" fontWeight="700" fill="#06130e" textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatUsd(geo.last, { digits: geo.last >= 100 ? 0 : 2 }).replace('$', '')}
            </text>

            {hp && (
              <g pointerEvents="none">
                <line x1={hx} x2={hx} y1={PAD.top} y2={height - PAD.bottom} stroke="rgba(255,255,255,0.25)" />
                <circle cx={hx} cy={hy} r="9" fill={color} opacity="0.18" />
                <circle cx={hx} cy={hy} r="4" fill={color} stroke="#13131f" strokeWidth="2" />
              </g>
            )}

            <rect
              x="0" y="0" width={width} height={height} fill="transparent"
              onPointerMove={onMove} onPointerDown={onMove}
              onPointerLeave={() => setHover(null)} onPointerCancel={() => setHover(null)}
              style={{ cursor: 'crosshair' }}
            />
          </svg>
        )}

        {hp && (
          <div style={{
            position: 'absolute', top: 6, left: tipLeft, width: 140, pointerEvents: 'none',
            background: 'rgba(10,10,15,0.94)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '7px 10px', backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{formatUsd(hp[1])}</div>
            <div style={{ fontSize: 10.5, color: '#9898b8', marginTop: 1 }}>{fmtTooltipTime(hp[0], range)}</div>
          </div>
        )}

        {status === 'loading' && !geo && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={18} color="#6a6a88" className="dash-spin" />
          </div>
        )}

        {status === 'error' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(11,17,27,0.7)',
          }}>
            <span style={{ fontSize: 13, color: '#9898b8' }}>Chart data is temporarily unavailable.</span>
            <button type="button" onClick={retry} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
              background: 'rgba(201,168,76,0.16)', border: '1px solid rgba(201,168,76,0.4)',
              color: '#e8c96a', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            }}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}
      </div>

      {/* % change strip — same layout as the reference screenshot */}
      <div style={{
        margin: '4px 14px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
          {STRIP.map((s) => {
            const v = coin?.changes?.[s.key];
            const up = (v ?? 0) >= 0;
            return (
              <div key={s.key} className="strip-cell" style={{ padding: '12px 2px', textAlign: 'center' }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#9898b8', marginBottom: 6 }}>{s.label}</div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12.5, fontWeight: 700,
                  color: v === null || v === undefined ? '#6a6a88' : up ? UP : DOWN, fontVariantNumeric: 'tabular-nums',
                }}>
                  {v !== null && v !== undefined && (up ? <TrendingUp size={12} strokeWidth={2.6} /> : <TrendingDown size={12} strokeWidth={2.6} />)}
                  {formatPct(v)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
