import { NextResponse } from 'next/server';
import prisma from '@/lib/prismakey';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BADGE_TYPES = ['INVESTMENT', 'DEPOSIT', 'WITHDRAWAL', 'KYC'];

// GET /api/user/notifications/badges
// How many unread updates the user has for each page, e.g.
// { counts: { INVESTMENT: 0, DEPOSIT: 2, WITHDRAWAL: 1, KYC: 0 } }
// Only updates made by the admin (approve / reject, payouts) are unread. The
// user's own submissions are saved already read, so they never add to a badge.
export async function GET(request) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const rows = await prisma.notification.groupBy({
      by: ['type'],
      where: { userId: session.id, isRead: false, type: { in: BADGE_TYPES } },
      _count: { _all: true },
    });

    const counts = { INVESTMENT: 0, DEPOSIT: 0, WITHDRAWAL: 0, KYC: 0 };
    for (const row of rows) counts[row.type] = row._count._all;
    return NextResponse.json({ counts });
  } catch (error) {
    console.error('Badge counts error:', error);
    return NextResponse.json({ error: 'Could not load notification counts' }, { status: 500 });
  }
}
