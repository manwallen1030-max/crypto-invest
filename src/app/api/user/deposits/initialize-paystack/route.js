import { NextResponse } from 'next/server';
import prisma from '@/lib/prismakey';
import { getUserFromRequest } from '@/lib/auth';
import { initializeTransaction } from '@/lib/paystack';

export async function POST(request) {
  const session = getUserFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { email: true, canDeposit: true },
  });
  if (!user?.canDeposit) {
    return NextResponse.json({ error: 'Deposits disabled' }, { status: 403 });
  }

  const { amount } = await request.json();
  const amountCents = Math.round(amount * 100);
  if (amountCents < 100) return NextResponse.json({ error: 'Minimum $1' }, { status: 400 });

  const reference = `dep_${session.id}_${Date.now()}`;
  const deposit = await prisma.deposit.create({
    data: {
      userId: session.id,
      amount: amountCents,
      method: 'PAYSTACK',
      reference,
      status: 'PENDING',
    },
  });

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/deposit?paystack_success=true&ref=${reference}`;

  const result = await initializeTransaction({
    email: user.email,
    amount: amountCents,
    reference,
    callback_url: callbackUrl,
    metadata: { depositId: deposit.id, userId: session.id },
  });

  if (!result.status) {
    await prisma.deposit.update({ where: { id: deposit.id }, data: { status: 'FAILED' } });
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({
    authorizationUrl: result.data.authorization_url,
    accessCode: result.data.access_code,
    reference: result.data.reference,
  });
}