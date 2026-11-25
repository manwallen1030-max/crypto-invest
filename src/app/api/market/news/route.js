import { cached, getJson, getText, parseRss } from '@/lib/marketData';

export const dynamic = 'force-dynamic';

// Latest crypto headlines. CryptoCompare first, Cointelegraph RSS as backup.
async function loadNews() {
  try {
    const json = await getJson('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
    const items = (json.Data || []).slice(0, 20).map((n) => ({
      id: String(n.id),
      title: n.title,
      url: n.url,
      source: n.source_info?.name || n.source || 'News',
      image: n.imageurl || null,
      publishedAt: n.published_on,
      tags: String(n.categories || '').split('|').filter(Boolean).slice(0, 2),
    }));
    if (items.length) return items;
    throw new Error('empty');
  } catch {
    const xml = await getText('https://cointelegraph.com/rss');
    return parseRss(xml, 'Cointelegraph');
  }
}

export async function GET() {
  try {
    const { data, stale } = await cached('news', 5 * 60_000, loadNews);
    return Response.json({ items: data, stale });
  } catch {
    return Response.json({ items: [], error: 'News is temporarily unavailable.' }, { status: 502 });
  }
}
