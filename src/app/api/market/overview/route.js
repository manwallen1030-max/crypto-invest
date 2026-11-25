import { cached, getJson, COIN_IDS } from '@/lib/marketData';

export const dynamic = 'force-dynamic';

// Live prices for the ticker, coin picker and the % change strip.
export async function GET() {
  try {
    const { data, stale } = await cached('overview', 45_000, async () => {
      const url =
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd' +
        `&ids=${COIN_IDS.join(',')}` +
        '&order=market_cap_desc&per_page=20&page=1&sparkline=true' +
        '&price_change_percentage=1h,24h,7d,14d,30d,200d,1y';
      const rows = await getJson(url);
      return rows.map((c) => ({
        id: c.id,
        symbol: String(c.symbol || '').toUpperCase(),
        name: c.name,
        image: c.image,
        price: c.current_price,
        marketCap: c.market_cap,
        volume: c.total_volume,
        high24h: c.high_24h,
        low24h: c.low_24h,
        changes: {
          '1h':   c.price_change_percentage_1h_in_currency,
          '24h':  c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h,
          '7d':   c.price_change_percentage_7d_in_currency,
          '14d':  c.price_change_percentage_14d_in_currency,
          '30d':  c.price_change_percentage_30d_in_currency,
          '200d': c.price_change_percentage_200d_in_currency,
          '1y':   c.price_change_percentage_1y_in_currency,
        },
        sparkline: c.sparkline_in_7d?.price
          ? c.sparkline_in_7d.price.filter((_, i) => i % 4 === 0)
          : [],
      }));
    });
    return Response.json({ coins: data, stale, updatedAt: Date.now() });
  } catch {
    return Response.json({ coins: [], error: 'Market data is temporarily unavailable.' }, { status: 502 });
  }
}
