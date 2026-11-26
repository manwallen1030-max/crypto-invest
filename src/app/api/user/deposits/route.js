import { NextResponse } from 'next/server';
import prisma from '@/lib/prismakey';
import { getUserFromRequest } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary, describeUploadError } from '@/lib/cloudinary';

export const runtime = 'nodejs';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,pdf';

export async function GET(request) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const deposits = await prisma.deposit.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    include: { walletAddress: { select: { label: true, address: true, network: true } } },
  });

  return NextResponse.json({ deposits });
}

export async function POST(request) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { canDeposit: true },
  });
  if (user && !user.canDeposit) {
    return NextResponse.json(
      { error: 'Deposits are currently disabled on your account. Contact support.' },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const amountDollars   = formData.get('amount');
  const method          = formData.get('method');
  const walletAddressId = formData.get('walletAddressId');
  const txHash          = formData.get('txHash');
  const proof           = formData.get('proof');

  const errors = {};
  const amount = Math.round(parseFloat(amountDollars || 0) * 100);
  if (!amountDollars || isNaN(amount) || amount < 100) {
    errors.amount = 'Minimum deposit is $1.00';
  }
  if (!method) errors.method = 'Please select a payment method';
  if (!proof || typeof proof === 'string') {
    errors.proof = 'Proof of payment (screenshot/receipt) is required';
  } else {
    if (!ALLOWED_TYPES.includes(proof.type)) errors.proof = 'Must be a JPG, PNG, WEBP, or PDF';
    else if (proof.size > MAX_SIZE) errors.proof = 'File must be under 5MB';
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  // Proof of payment is stored on Cloudinary; the database keeps its URL.
  let proofImageUrl;
  try {
    ({ url: proofImageUrl } = await uploadToCloudinary(proof, {
      folder: 'deposits',
      name: session.id,
      allowedFormats: ALLOWED_FORMATS,
    }));
  } catch (err) {
    const { status, message } = describeUploadError(err);
    return NextResponse.json({ error: message }, { status });
  }

  let deposit;
  try {
    deposit = await prisma.deposit.create({
      data: {
        userId: session.id,
        amount,
        method,
        walletAddressId: walletAddressId || null,
        txHash: txHash || null,
        proofImageUrl,
        status: 'PENDING',
      },
    });
  } catch (err) {
    // The deposit wasn't saved, so don't leave the uploaded proof behind.
    console.error('Deposit save failed:', err);
    await deleteFromCloudinary(proofImageUrl);
    return NextResponse.json({ error: 'Could not save your deposit. Please try again.' }, { status: 500 });
  }

  // Record of the submission. It is saved as already read, because the user
  // just did this themselves: the Deposit History badge counts only updates
  // made by the admin (approve / reject). A failed notification shouldn't
  // undo a deposit that was saved.
  try {
    await prisma.notification.create({
      data: {
        userId:  session.id,
        type:    'DEPOSIT',
        isRead:  true,
        title:   'Deposit Submitted',
        message: `Your deposit of $${(amount / 100).toFixed(2)} via ${method} was submitted and is awaiting review.`,
        link:    `/dashboard/deposit/history#${deposit.id}`,
      },
    });
  } catch (err) {
    console.error('Deposit notification failed:', err);
  }

  return NextResponse.json({ message: 'Deposit submitted for review', deposit });
}
