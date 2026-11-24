import { NextResponse } from 'next/server';
import prisma from '@/lib/prismakey';
import { getUserFromRequest } from '@/lib/auth';
import { logAudit } from '@/lib/auditLog';

class NotPendingError extends Error {}

// POST /api/admin/investments/:id/reject   body: { note }
// Moves the investment PENDING -> REJECTED and tells the user why.
//
// Investments made from the account balance had their amount taken out when
// the request was submitted, so rejecting one gives that money back (with a
// REFUND entry in the user's history). Older requests that were paid from an
// outside wallet carry a payment screenshot (proofImageUrl) and never touched
// the balance, so nothing is refunded for those.
export async function POST(request, { params }) {
  const session = getUserFromRequest(request);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body   = await request.json().catch(() => ({})); // tolerate an empty body
  const reason = typeof body?.note === 'string' && body.note.trim()
    ? body.note.trim().slice(0, 500)
    : 'Rejected by admin';

  try {
    const investment = await prisma.investment.findUnique({ where: { id } });

    if (!investment) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }
    if (investment.status !== 'PENDING') {
      return NextResponse.json({ error: 'Investment is not pending' }, { status: 400 });
    }

    const refunds = !investment.proofImageUrl; // paid from balance -> give it back

    const refundedBalance = await prisma.$transaction(async (tx) => {
      // The status check is part of the update, so a second click can't
      // refund twice.
      const done = await tx.investment.updateMany({
        where: { id, status: 'PENDING' },
        data:  { status: 'REJECTED', adminNote: reason },
      });
      if (done.count === 0) throw new NotPendingError();

      if (!refunds) return null;

      const user = await tx.user.findUnique({
        where:  { id: investment.userId },
        select: { balance: true },
      });
      const balanceAfter = user.balance + investment.amount;

      await tx.user.update({
        where: { id: investment.userId },
        data:  { balance: { increment: investment.amount } },
      });

      await tx.transaction.create({
        data: {
          userId:        investment.userId,
          type:          'REFUND',
          amount:        investment.amount,
          balanceBefore: user.balance,
          balanceAfter,
          description:   `Refund — ${investment.planName} investment request rejected`,
          referenceId:   id,
        },
      });

      return balanceAfter;
    });

    await logAudit({
      adminId:    session.id,
      action:     'INVESTMENT_REJECTED',
      targetType: 'Investment',
      targetId:   id,
      details:    { userId: investment.userId, planName: investment.planName, amount: investment.amount, note: reason, refunded: refunds },
      request,
    });

    try {
      const money = `$${(investment.amount / 100).toFixed(2)}`;
      await prisma.notification.create({
        data: {
          userId:  investment.userId,
          type:    'INVESTMENT',
          title:   'Investment Request Rejected',
          message: refunds
            ? `Your ${money} investment request for the ${investment.planName} plan was rejected. Reason: ${reason}. The ${money} has been returned to your balance.`
            : `Your ${money} investment request for the ${investment.planName} plan was rejected. Reason: ${reason}. If you already sent a payment, please contact support so we can sort it out.`,
          link:    `/dashboard/investments/history#${id}`,
        },
      });
    } catch (err) {
      console.error('Investment rejection notification failed:', err);
    }

    return NextResponse.json({
      message: refunds ? 'Investment rejected and amount refunded' : 'Investment rejected',
      ...(refundedBalance !== null ? { refunded: investment.amount } : {}),
    });
  } catch (error) {
    if (error instanceof NotPendingError) {
      return NextResponse.json({ error: 'Investment is not pending' }, { status: 400 });
    }
    console.error('Reject investment error:', error);
    return NextResponse.json({ error: 'Could not reject investment' }, { status: 500 });
  }
}