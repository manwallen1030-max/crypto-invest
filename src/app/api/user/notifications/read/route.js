import { NextResponse } from 'next/server';
import prisma from '@/lib/prismakey';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

const BADGE_TYPES = ['INVESTMENT', 'DEPOSIT', 'WITHDRAWAL', 'KYC'];

// POST /api/user/notifications/read   body: { type: 'DEPOSIT' | 'WITHDRAWAL' | 'INVESTMENT' | 'KYC' }
// Called when the user opens a History page: marks that section's unread
// updates as read, which clears its badge.
export async function POST(request) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const type = body?.type;
  if (!BADGE_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
  }

  try {
    const { count } = await prisma.notification.updateMany({
      where: { userId: session.id, type, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ marked: count });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json({ error: 'Could not update notifications' }, { status: 500 });
  }
}
