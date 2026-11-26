import { NextResponse } from 'next/server';
import prisma from '@/lib/prismakey';
import { getUserFromRequest } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary, describeUploadError } from '@/lib/cloudinary';

// Uploads go to Cloudinary over the network; keep this on the Node runtime.
export const runtime = 'nodejs';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB — ID photos are often larger than avatars
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,pdf';

// Documents are stored on Cloudinary (see src/lib/cloudinary.js) and the
// database keeps each URL. Every file gets a random, unguessable name.
// Note: these are sensitive ID documents. If you want them fully private
// (only viewable through short-lived signed links), Cloudinary supports
// "authenticated" delivery; ask for that as a follow-up.

export async function GET(request) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { kycStatus: true },
  });

  const submissions = await prisma.kycSubmission.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, docType: true, status: true, adminNote: true,
      createdAt: true, reviewedAt: true,
    },
  });

  return NextResponse.json({
    kycStatus: user?.kycStatus || 'NOT_SUBMITTED',
    submissions,
    latest: submissions[0] || null,
  });
}

export async function POST(request) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { kycStatus: true },
  });

  // Don't allow resubmitting while something's already pending, or after
  // it's already approved — only allowed from NOT_SUBMITTED, REJECTED, or
  // RESUBMIT_REQUESTED.
  if (user?.kycStatus === 'PENDING') {
    return NextResponse.json(
      { error: 'You already have a submission under review.' },
      { status: 409 }
    );
  }
  if (user?.kycStatus === 'APPROVED') {
    return NextResponse.json(
      { error: 'Your identity is already verified.' },
      { status: 409 }
    );
  }

  const formData = await request.formData();
  const docType   = formData.get('docType');
  const docFront  = formData.get('docFront');
  const docBack   = formData.get('docBack');
  const selfie    = formData.get('selfie');

  const errors = {};
  if (!docType) errors.docType = 'Please select a document type';
  if (!docFront || typeof docFront === 'string') errors.docFront = 'Front of document is required';
  if (!selfie || typeof selfie === 'string') errors.selfie = 'A selfie holding your document is required';

  for (const [key, file] of [['docFront', docFront], ['docBack', docBack], ['selfie', selfie]]) {
    if (file && typeof file !== 'string') {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors[key] = 'Must be a JPG, PNG, WEBP, or PDF';
      } else if (file.size > MAX_SIZE) {
        errors[key] = 'File must be under 5MB';
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  // Upload all documents together. If any one fails, remove the ones that
  // did succeed so no half-finished submission is left on Cloudinary.
  const hasBack = docBack && typeof docBack !== 'string';
  const toUpload = [
    ['front', docFront],
    ['back', hasBack ? docBack : null],
    ['selfie', selfie],
  ];

  const results = await Promise.allSettled(
    toUpload.map(([label, file]) =>
      file
        ? uploadToCloudinary(file, { folder: 'kyc', name: `${session.id}-${label}`, allowedFormats: ALLOWED_FORMATS })
        : Promise.resolve(null)
    )
  );

  const failed = results.find((r) => r.status === 'rejected');
  if (failed) {
    await Promise.all(
      results.filter((r) => r.status === 'fulfilled' && r.value).map((r) => deleteFromCloudinary(r.value.url))
    );
    const { status, message } = describeUploadError(failed.reason);
    return NextResponse.json({ error: message }, { status });
  }

  const [docFrontUrl, docBackUrl, selfieUrl] = results.map((r) => r.value?.url ?? null);

  let submission;
  try {
    submission = await prisma.kycSubmission.create({
      data: {
        userId: session.id,
        docType,
        docFrontUrl,
        docBackUrl,
        selfieUrl,
        status: 'PENDING',
      },
    });
  } catch (err) {
    console.error('KYC save failed:', err);
    await Promise.all([docFrontUrl, docBackUrl, selfieUrl].filter(Boolean).map(deleteFromCloudinary));
    return NextResponse.json({ error: 'Could not save your documents. Please try again.' }, { status: 500 });
  }

  await prisma.user.update({
    where: { id: session.id },
    data: { kycStatus: 'PENDING' },
  });

  // Record of the submission, saved as already read: the KYC badge counts only
  // decisions made by the admin.
  try {
    await prisma.notification.create({
      data: {
        userId:  session.id,
        type:    'KYC',
        isRead:  true,
        title:   'Documents Submitted',
        message: 'Your identity documents were submitted and are awaiting review.',
        link:    `/dashboard/kyc#${submission.id}`,
      },
    });
  } catch (err) {
    console.error('KYC notification failed:', err);
  }

  return NextResponse.json({ message: 'Documents submitted for review', submission });
}
