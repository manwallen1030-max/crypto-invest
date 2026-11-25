import { cached, getJson, downsample, COIN_IDS } from '@/lib/marketData';

export const dynamic = 'force-dynamic';

const RANGES = { '1': 60_000, '7': 180_000, '30': 300_000, '90': 600_000, '365': 900_000 };

// Price history for the main chart. ?id=bitcoin&days=1|7|30|90|365
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || 'bitcoin';
  const days = searchParams.get('days') || '1';

  if (!COIN_IDS.includes(id) || !RANGES[days]) {
    return Response.json({ error: 'Unsupported coin or range.' }, { status: 400 });
  }

  try {
    const { data, stale } = await cached(`chart:${id}:${days}`, RANGES[days], async () => {
      const json = await getJson(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`
      );
      return downsample(json.prices || [], 200).map(([t, p]) => [t, p]);
    });
    return Response.json({ id, days, prices: data, stale });
  } catch {
    return Response.json({ id, days, prices: [], error: 'Chart data is temporarily unavailable.' }, { status: 502 });
  }
}
