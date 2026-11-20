import { NextResponse } from 'next/server';
import prisma from '@/lib/prismakey';
import { verifyTransaction, verifyWebhookSignature } from '@/lib/paystack';

export async function POST(request) {
  const signature = request.headers.get('x-paystack-signature');
  const payload = await request.text();

  if (!verifyWebhookSignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(payload);

  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const { reference, amount, status, paid_at, channel, currency } = event.data;

  if (status !== 'success') {
    return NextResponse.json({ received: true });
  }

  const deposit = await prisma.deposit.findUnique({ where: { reference } });
  if (!deposit || deposit.status !== 'PENDING') {
    return NextResponse.json({ received: true });
  }

  const verification = await verifyTransaction(reference);
  if (!verification.status || verification.data.status !== 'success') {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.deposit.update({
      where: { id: deposit.id },
      data: {
        status: 'APPROVED',
        txHash: reference,
        proofImageUrl: `paystack:${channel}`,
        approvedAt: new Date(paid_at),
      },
    });

    const user = await tx.user.findUnique({
      where: { id: deposit.userId },
      select: { balance: true },
    });

    await tx.user.update({
      where: { id: deposit.userId },
      data: { balance: { increment: deposit.amount } },
    });

    await tx.transaction.create({
      data: {
        userId: deposit.userId,
        type: 'DEPOSIT',
        amount: deposit.amount,
        balanceBefore: user.balance - deposit.amount,
        balanceAfter: user.balance,
        description: `Paystack deposit — ${channel}`,
        referenceId: deposit.id,
      },
    });
  });

  return NextResponse.json({ received: true });
}