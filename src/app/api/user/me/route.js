import { NextResponse } from 'next/server';
import prisma from '@/lib/prismakey';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const [user, activeInvestments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        country: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        kycStatus: true,
        balance: true,
        totalDeposited: true,
        totalWithdrawn: true,
        totalProfit: true,
        referralCode: true,
        createdAt: true,
      },
    }),
    prisma.investment.count({ where: { userId: session.id, status: 'ACTIVE' } }),
  ]);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: { ...user, activeInvestments } });
}