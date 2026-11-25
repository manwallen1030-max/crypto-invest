'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';
import { timeAgo } from '@/lib/market';

function Thumb({ src, source }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div style={{
        width: 72, height: 72, borderRadius: 12, flexShrink: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#1e1e35', border: '1px solid rgba(255,255,255,0.06)',
        color: '#e8c96a', fontWeight: 800, fontSize: 20,
      }}>
        {(source || 'N').slice(0, 1)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" onError={() => setFailed(true)}
      style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', flexShrink: 0, background: '#16162a' }} />
  );
}

export default function NewsFeed({ limit = 6 }) {
  const listRef = useRef(null);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');

  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/market/news');
        const data = await res.json();
        if (cancelled) return;
        if (data.items?.length) { setItems(data.items); setStatus('ok'); }
        else setStatus('error');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [nonce]);

  const refresh = () => { setStatus('loading'); setNonce((n) => n + 1); };

  useGSAP(() => {
    if (status !== 'ok') return;
    gsap.fromTo('.news-item', { y: 18, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'power3.out',
    });
  }, { dependencies: [status], scope: listRef });

  return (
    <section data-reveal style={{
      background: '#13131f',
      border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700, color: '#f0f0fa' }}>
          <Newspaper size={17} color="#c9a84c" /> Market News
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: '#16c784' }}>
            <span className="live-dot" /> LIVE
          </span>
        </div>
        <button type="button" onClick={refresh} aria-label="Refresh news" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6a6a88', display: 'flex' }}>
          <RefreshCw size={15} className={status === 'loading' ? 'dash-spin' : undefined} />
        </button>
      </div>

      <div ref={listRef}>
        {status === 'loading' && !items.length && [0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: 16 }}>
            <div className="skeleton" style={{ width: 72, height: 72, borderRadius: 12 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 12, width: '90%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 14 }} />
              <div className="skeleton" style={{ height: 10, width: '35%' }} />
            </div>
          </div>
        ))}

        {status === 'error' && !items.length && (
          <div style={{ padding: '36px 20px', textAlign: 'center', fontSize: 13, color: '#9898b8' }}>
            Headlines are temporarily unavailable.
          </div>
        )}

        {items.slice(0, limit).map((n, i, arr) => (
          <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer" className="news-item news-link"
            style={{
              display: 'flex', gap: 14, padding: '14px 18px', textDecoration: 'none',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
            <Thumb src={n.image} source={n.source} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 13.5, fontWeight: 600, color: '#f0f0fa', lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {n.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, fontSize: 11.5, color: '#6a6a88', flexWrap: 'wrap' }}>
                <b style={{ color: '#e8c96a', fontWeight: 600 }}>{n.source}</b>
                {n.publishedAt && <span>· {timeAgo(n.publishedAt)}</span>}
                {n.tags?.[0] && (
                  <span style={{ padding: '1px 7px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', fontSize: 10.5 }}>{n.tags[0]}</span>
                )}
                <ExternalLink size={11} style={{ marginLeft: 'auto' }} />
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
