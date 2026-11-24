import { NextResponse } from 'next/server';
import prisma from '@/lib/prismakey';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

class InsufficientBalanceError extends Error {
  constructor(balance) { super('INSUFFICIENT_BALANCE'); this.balance = balance; }
}
class InvestingDisabledError extends Error {}
class UserNotFoundError extends Error {}

// GET — fetch user's investment history
export async function GET(request) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const investments = await prisma.investment.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    include: {
      plan: { select: { name: true, rate: true, duration: true } },
    },
  });

  return NextResponse.json({ investments });
}

// POST — user invests from their account balance.
// The amount leaves the balance straight away (same as a withdrawal request)
// and the request waits as PENDING for the admin. If the admin rejects it, the
// amount is refunded to the balance; if approved, it becomes an ACTIVE investment.
export async function POST(request) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // ── Validation ──────────────────────────────────────────
  const errors = {};
  const planId = body.planId;
  const amount = Math.round(parseFloat(body.amount) * 100);

  if (!planId) errors.planId = 'Please select an investment plan';
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = 'Enter the amount you want to invest';

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    // ── Check plan exists and the amount fits its limits ─────
    const plan = await prisma.investmentPlan.findUnique({ where: { id: planId } });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'This plan is no longer available.' }, { status: 400 });
    }
    if (amount < plan.minAmount) {
      return NextResponse.json(
        { error: `Minimum investment for this plan is $${(plan.minAmount / 100).toFixed(2)}` },
        { status: 400 }
      );
    }
    if (plan.maxAmount && amount > plan.maxAmount) {
      return NextResponse.json(
        { error: `Maximum investment for this plan is $${(plan.maxAmount / 100).toFixed(2)}` },
        { status: 400 }
      );
    }

    // ── Pre-calculate expected profit (display only) ─────────
    // Admin controls the actual payout amount manually.
    const expectedProfit = Math.round(amount * (plan.rate / 100));
    const expectedReturn = amount + expectedProfit;

    // ── Take the money and create the request, all or nothing ─
    const { investment, newBalance } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where:  { id: session.id },
        select: { balance: true, canInvest: true },
      });
      if (!user) throw new UserNotFoundError();
      if (!user.canInvest) throw new InvestingDisabledError();
      if (user.balance < amount) throw new InsufficientBalanceError(user.balance);

      // The balance check is part of the update itself, so two requests sent
      // at the same moment can never spend the same money twice.
      const debit = await tx.user.updateMany({
        where: { id: session.id, balance: { gte: amount } },
        data:  { balance: { decrement: amount } },
      });
      if (debit.count === 0) throw new InsufficientBalanceError(user.balance);

      const created = await tx.investment.create({
        data: {
          userId:   session.id,
          planId:   plan.id,
          planName: plan.name,
          amount,
          rate:     plan.rate,
          expectedProfit,
          expectedReturn,
          status:   'PENDING',
          // startDate and maturityDate are set by admin on approval
        },
      });

      await tx.transaction.create({
        data: {
          userId:        session.id,
          type:          'INVESTMENT',
          amount:        -amount,
          balanceBefore: user.balance,
          balanceAfter:  user.balance - amount,
          description:   `Investment in ${plan.name} plan (awaiting approval)`,
          referenceId:   created.id,
        },
      });

      return { investment: created, newBalance: user.balance - amount };
    });

    // ── Record the submission for the user ──
    // Saved as already read: the Investment History badge counts only updates
    // made by the admin. The request is already saved; a failed notification
    // shouldn't undo it.
    try {
      await prisma.notification.create({
        data: {
          userId:  session.id,
          type:    'INVESTMENT',
          isRead:  true,
          title:   'Investment Submitted',
          message: `Your $${(amount / 100).toFixed(2)} investment in the ${plan.name} plan was submitted and is awaiting approval.`,
          link:    `/dashboard/investments/history#${investment.id}`,
        },
      });
    } catch (err) {
      console.error('Investment notification failed:', err);
    }

    // ── Notify admin ─────────────────────────────────────────
    // Non-critical — don't fail the request if email fails
    try {
      const { sendAdminNotification } = await import('@/lib/email');
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { firstName: true, lastName: true, email: true },
      });
      await sendAdminNotification(
        `New Investment Request — $${(amount / 100).toFixed(2)}`,
        `
          <h2>New Investment Request</h2>
          <p>
            <strong>${user.firstName} ${user.lastName}</strong> (${user.email})
            has invested from their account balance.
          </p>
          <ul style="margin:16px 0 0 20px;line-height:2;color:#9898b8">
            <li>Plan: <strong style="color:#f0f0fa">${plan.name}</strong></li>
            <li>Amount: <strong style="color:#c9a84c">$${(amount / 100).toFixed(2)}</strong></li>
          </ul>
          <p style="margin-top:20px">
            Review it in the
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/investments" style="color:#c9a84c">
              admin dashboard
            </a>.
          </p>
        `
      );
    } catch (e) {
      console.error('Admin notification failed:', e.message);
    }

    return NextResponse.json(
      {
        message: 'Investment request submitted. It is waiting for admin approval.',
        investment,
        newBalance,
      },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      return NextResponse.json(
        { error: `Insufficient balance. You have $${(error.balance / 100).toFixed(2)} available.` },
        { status: 400 }
      );
    }
    if (error instanceof InvestingDisabledError) {
      return NextResponse.json(
        { error: 'Investing is currently disabled on your account. Contact support.' },
        { status: 403 }
      );
    }
    if (error instanceof UserNotFoundError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('Investment submission error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}