// Server-side helpers for the dashboard's live market widgets.
//
// Data sources (all free, no API key):
//   • CoinGecko public API  → prices, % changes, sparklines, chart history
//   • CryptoCompare news    → headlines (Cointelegraph RSS is the fallback)
//
// Every user's dashboard polls these through our own /api/market/* routes, so
// we keep a small in-memory cache here. That keeps us far below the providers'
// rate limits no matter how many people are online, and lets us serve the last
// good response if a provider has a bad moment.

const CACHE = new Map(); // key -> { at, data }

export async function cached(key, ttlMs, loader) {
  const hit = CACHE.get(key);
  const now = Date.now();
  if (hit && now - hit.at < ttlMs) return { data: hit.data, stale: false };
  try {
    const data = await loader();
    CACHE.set(key, { at: now, data });
    return { data, stale: false };
  } catch (err) {
    // Provider hiccup: serve the last good copy if we have one.
    if (hit) return { data: hit.data, stale: true };
    throw err;
  }
}

export async function getJson(url, timeoutMs = 8000) {
  const res = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'vaultex-dashboard/1.0' },
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  return res.json();
}

export async function getText(url, timeoutMs = 8000) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'vaultex-dashboard/1.0' },
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  return res.text();
}

// Coins shown in the picker / ticker, in display order.
export const COINS = [
  { id: 'bitcoin',      symbol: 'BTC' },
  { id: 'ethereum',     symbol: 'ETH' },
  { id: 'solana',       symbol: 'SOL' },
  { id: 'binancecoin',  symbol: 'BNB' },
  { id: 'ripple',       symbol: 'XRP' },
  { id: 'dogecoin',     symbol: 'DOGE' },
  { id: 'cardano',      symbol: 'ADA' },
  { id: 'tether',       symbol: 'USDT' },
];

export const COIN_IDS = COINS.map((c) => c.id);

// Keep chart payloads small: pick ~`max` evenly spaced points.
export function downsample(points, max = 180) {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  const out = [];
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}

const decode = (s = '') =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
   .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
   .replace(/<[^>]+>/g, '').trim();

// Minimal RSS item parser (no dependency) for the news fallback.
export function parseRss(xml, source) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) && items.length < 20) {
    const block = m[1];
    const tag = (t) => (block.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1];
    const title = decode(tag('title'));
    const url = decode(tag('link'));
    const pub = decode(tag('pubDate'));
    const img =
      (block.match(/<media:content[^>]*url="([^"]+)"/) || [])[1] ||
      (block.match(/<enclosure[^>]*url="([^"]+)"/) || [])[1] ||
      null;
    if (!title || !url) continue;
    items.push({
      id: url,
      title,
      url,
      source,
      image: img,
      publishedAt: pub ? Math.floor(new Date(pub).getTime() / 1000) : null,
      tags: [],
    });
  }
  return items;
}
