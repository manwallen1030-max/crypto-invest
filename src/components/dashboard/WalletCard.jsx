'use client';

import { useEffect, useId, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Copy } from 'lucide-react';
import { centsToDollars } from '@/lib/currency';

const HIDE_KEY = 'vaultex_hide_balance';

const subscribeHide = (cb) => {
  window.addEventListener('vaultex:hide-balance', cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener('vaultex:hide-balance', cb);
    window.removeEventListener('storage', cb);
  };
};
const readHide = () => { try { return localStorage.getItem(HIDE_KEY) === '1'; } catch { return false; } };

// Shared "hide my balance" preference (persisted, synced across components).
export function useHideBalance() {
  const hidden = useSyncExternalStore(subscribeHide, readHide, () => false);
  const toggle = () => {
    try { localStorage.setItem(HIDE_KEY, hidden ? '0' : '1'); } catch {}
    window.dispatchEvent(new Event('vaultex:hide-balance'));
  };
  return [hidden, toggle];
}

export const money = (cents) =>
  centsToDollars(cents).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Wallet ID derived from the account id so it is stable but not the raw id.
export function walletId(user) {
  const raw = String(user?.id || user?.email || 'vaultex').replace(/[^a-z0-9]/gi, '').toUpperCase();
  const tail = raw.slice(-8).padStart(8, '0');
  return `VLX ${tail.slice(0, 4)} ${tail.slice(4)}`;
}

// Animated balance figure: counts up whenever the value changes.
export function CountUp({ cents, hidden, style }) {
  const ref = useRef(null);
  const obj = useRef({ v: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el || hidden) return;
    const tw = gsap.to(obj.current, {
      v: cents || 0, duration: 1.2, ease: 'power3.out',
      onUpdate: () => { el.textContent = money(obj.current.v); },
    });
    return () => tw.kill();
  }, [cents, hidden]);
  return <span ref={ref} style={style}>{hidden ? '••••••' : money(cents)}</span>;
}

// A leather billfold, drawn the way a real one looks from the front: cash and
// cards poking out of the pocket, a stitched leather body, a snap tongue, and
// the balance foil-stamped in gold. Flat colours and plain edges only.
const GOLD = '#c9a84c';
const GOLD_LIGHT = '#e8c96a';
const LEATHER = '#1d1812';
const LEATHER_BACK = '#14100c';

function memberSince(user) {
  const d = user?.createdAt ? new Date(user.createdAt) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' });
}

function Bill({ x, y, rot, fill, line, ink }) {
  return (
    <g transform={`rotate(${rot} ${x + 95} ${y + 48})`}>
      <g className="w-bill">
        <rect x={x} y={y} width="190" height="96" rx="8" fill={fill} stroke={line} strokeWidth="1.5" />
        <rect x={x + 8} y={y + 8} width="174" height="80" rx="5" fill="none" stroke={line} strokeWidth="1" opacity="0.55" />
        <circle cx={x + 95} cy={y + 48} r="24" fill="none" stroke={line} strokeWidth="1.2" opacity="0.8" />
        <text x={x + 95} y={y + 58} textAnchor="middle" fontSize="28" fontWeight="700" fill={ink} fontFamily="Georgia, serif">$</text>
        <text x={x + 18} y={y + 28} fontSize="14" fontWeight="700" fill={ink} fontFamily="Georgia, serif">100</text>
        <text x={x + 172} y={y + 80} textAnchor="end" fontSize="14" fontWeight="700" fill={ink} fontFamily="Georgia, serif">100</text>
      </g>
    </g>
  );
}

function SlotCard({ x, y, rot, fill, children }) {
  return (
    <g transform={`rotate(${rot} ${x + 80} ${y + 50})`}>
      <g className="w-card">
        <rect x={x} y={y} width="170" height="104" rx="11" fill={fill} stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
        {children}
      </g>
    </g>
  );
}

export default function WalletCard({ user, balance = 0, profit = 0, deposited = 0, compact = false, showStats = true, onNavigate }) {
  const [hidden, toggle] = useHideBalance();
  const uid = useId().replace(/:/g, '');
  const rootRef = useRef(null);
  const openRef = useRef(false);
  const since = memberSince(user);
  const id = walletId(user);

  // Cash and cards slide up into place when the wallet appears.
  useGSAP(() => {
    gsap.fromTo('.w-bill', { y: 42, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out', delay: 0.35 });
    gsap.fromTo('.w-card', { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, stagger: 0.1, ease: 'back.out(1.6)', delay: 0.5 });
    gsap.fromTo('.w-snap', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, ease: 'back.out(3)', delay: 0.9 });
  }, { scope: rootRef });

  // Peek at what is inside: cash and cards lift when you hover / tap the wallet.
  const lift = (open) => {
    openRef.current = open;
    gsap.to(rootRef.current.querySelectorAll('.w-bill'), { y: open ? -16 : 0, duration: 0.5, stagger: 0.05, ease: 'power3.out', overwrite: 'auto' });
    gsap.to(rootRef.current.querySelectorAll('.w-card'), { y: open ? -11 : 0, duration: 0.5, stagger: 0.05, ease: 'power3.out', overwrite: 'auto' });
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success('Wallet ID copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const pad = compact ? 14 : 18;

  return (
    <div ref={rootRef}>
      <div
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') lift(true); }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') lift(false); }}
        onClick={() => lift(!openRef.current)}
        style={{ position: 'relative', width: '100%', aspectRatio: '400 / 282', cursor: 'pointer' }}
      >
        <svg viewBox="0 0 400 282" width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }} role="img" aria-label="Wallet">
          <defs>
            <clipPath id={`body-${uid}`}><rect x="0" y="96" width="400" height="186" rx="22" /></clipPath>
            <filter id={`grain-${uid}`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" />
              <feColorMatrix in="n" type="saturate" values="0" />
              <feComponentTransfer><feFuncA type="linear" slope="0.11" /></feComponentTransfer>
            </filter>
          </defs>

          {/* back of the wallet */}
          <rect x="0" y="52" width="400" height="230" rx="22" fill={LEATHER_BACK} stroke="#3a2f20" strokeWidth="1.5" />

          {/* cash sticking out of the main compartment */}
          <Bill x={196} y={22} rot={7} fill="#2f6a4c" line="#72b794" ink="#b5e0c8" />
          <Bill x={176} y={8} rot={-2} fill="#3b7c5a" line="#86c7a5" ink="#c4e8d4" />

          {/* cards tucked into the pocket */}
          <SlotCard x={58} y={44} rot={3} fill="#2c2c46">
            <rect x={58} y={64} width="170" height="12" fill={GOLD} opacity="0.85" />
          </SlotCard>
          <SlotCard x={42} y={54} rot={-1} fill="#34b8a6" />
          <SlotCard x={26} y={66} rot={-5} fill={GOLD}>
            <rect x={26 + 16} y={66 + 22} width="34" height="26" rx="5" fill="#a8722a" />
            <path d={`M${26 + 16} ${66 + 35}h34M${26 + 33} ${66 + 22}v26`} stroke="#7d5518" strokeWidth="1" fill="none" />
          </SlotCard>

          {/* leather body */}
          <rect x="0" y="96" width="400" height="186" rx="22" fill={LEATHER} stroke="#3a2f20" strokeWidth="1.5" />
          <rect x="0" y="96" width="400" height="186" fill="#fff" filter={`url(#grain-${uid})`} clipPath={`url(#body-${uid})`} style={{ mixBlendMode: 'soft-light' }} pointerEvents="none" />
          {/* pocket lip */}
          <path d="M22 97.5H378" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
          {/* gold stitching */}
          <rect x="10" y="108" width="380" height="164" rx="15" fill="none" stroke={GOLD} strokeWidth="1.4" strokeDasharray="5 4" opacity="0.75" />

          {/* snap tongue */}
          <g>
            <path d="M296 96h50v44a8 8 0 0 1-8 8h-34a8 8 0 0 1-8-8z" fill="#2a2218" stroke="#3a2f20" strokeWidth="1.5" />
            <path d="M302 100v38a3 3 0 0 0 3 3h36a3 3 0 0 0 3-3v-38" fill="none" stroke={GOLD} strokeWidth="1.1" strokeDasharray="4 3" opacity="0.7" />
            <g className="w-snap">
              <circle cx="321" cy="124" r="11" fill={GOLD} stroke="#a8722a" strokeWidth="1.5" />
              <circle cx="321" cy="124" r="6" fill="none" stroke="#a8722a" strokeWidth="1.2" />
              <circle cx="321" cy="124" r="2" fill="#a8722a" />
            </g>
          </g>
        </svg>

        {/* foil-stamped content on the leather */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(186 / 282) * 100}%`,
          padding: `${compact ? 18 : 24}px ${pad + 6}px ${pad + (compact ? 8 : 4)}px`,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: compact ? 10 : 11, letterSpacing: '0.18em', color: '#a08a5a', fontWeight: 700 }}>
              TOTAL BALANCE
              <button type="button" onClick={(e) => { e.stopPropagation(); toggle(); }} aria-label={hidden ? 'Show balance' : 'Hide balance'}
                style={{ pointerEvents: 'auto', background: 'none', border: 'none', color: '#a08a5a', cursor: 'pointer', display: 'flex', padding: 2 }}>
                {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: compact ? 4 : 6 }}>
              <span style={{ fontSize: compact ? 16 : 20, fontWeight: 700, color: GOLD }}>$</span>
              <CountUp cents={balance} hidden={hidden} style={{
                fontSize: compact ? 28 : 'clamp(30px, 8.4vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums', color: GOLD_LIGHT,
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: compact ? 11 : 12, fontWeight: 700, letterSpacing: '0.1em', color: '#d9cdb0', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 190 }}>
                {user?.firstName} {user?.lastName}
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); copyId(); }} aria-label="Copy wallet ID" style={{
                pointerEvents: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 3,
                color: '#8d7d58', fontSize: compact ? 10 : 11.5, letterSpacing: compact ? '0.08em' : '0.14em', whiteSpace: 'nowrap',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              }}>
                {id}{since && !compact ? ` · ${since}` : ''}
                <Copy size={11} />
              </button>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, opacity: 0.85 }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, border: `1px solid ${GOLD}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={12} color={GOLD} strokeWidth={2.6} />
              </span>
              {!compact && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: GOLD }}>VAULTEX</span>}
            </span>
          </div>
        </div>
      </div>

      {/* quick numbers + actions sit under the wallet */}
      {showStats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
          <div style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '11px 13px' }}>
            <div style={{ fontSize: 10.5, color: '#9898b8', display: 'flex', alignItems: 'center', gap: 5 }}><TrendingUp size={12} color="#16c784" /> Total profit</div>
            <div style={{ fontSize: 14.5, fontWeight: 800, marginTop: 3, color: '#16c784', fontVariantNumeric: 'tabular-nums' }}>{hidden ? '••••' : `$${money(profit)}`}</div>
          </div>
          <div style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '11px 13px' }}>
            <div style={{ fontSize: 10.5, color: '#9898b8', display: 'flex', alignItems: 'center', gap: 5 }}><ArrowDownToLine size={12} color="#34b8a6" /> Deposited</div>
            <div style={{ fontSize: 14.5, fontWeight: 800, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{hidden ? '••••' : `$${money(deposited)}`}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: showStats ? 8 : 14 }}>
        <Link href="/dashboard/deposit/new" onClick={onNavigate} className="wallet-btn" style={{ background: GOLD, color: '#0a0a0f' }}>
          <ArrowDownToLine size={15} /> Deposit
        </Link>
        <Link href="/dashboard/withdraw/new" onClick={onNavigate} className="wallet-btn" style={{ background: 'transparent', color: '#34b8a6', border: '1px solid rgba(52,184,166,0.45)' }}>
          <ArrowUpFromLine size={15} /> Withdraw
        </Link>
      </div>
    </div>
  );
}
