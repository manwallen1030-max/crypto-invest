import { NextResponse } from 'next/server';
import prisma from '@/lib/prismakey';
import { getUserFromRequest } from '@/lib/auth';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  parseCloudinaryUrl,
  describeUploadError,
} from '@/lib/cloudinary';

export const runtime = 'nodejs';

const MAX_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,gif';

// Photos are stored on Cloudinary (see src/lib/cloudinary.js); the database
// just keeps the URL. Accounts that uploaded a photo before this change still
// have an old "/uploads/avatars/..." link, which keeps working as-is.

// Remove whichever kind of old avatar the user had. Never throws.
async function removeOldAvatar(url) {
  if (!url) return;

  if (parseCloudinaryUrl(url)) {
    await deleteFromCloudinary(url);
    return;
  }

  // Legacy local file from before the switch to Cloudinary.
  if (url.startsWith('/uploads/avatars/')) {
    try {
      const { unlink } = await import('fs/promises');
      const path = (await import('path')).default;
      await unlink(path.join(process.cwd(), 'public', url));
    } catch {
      // Already gone, or the host has a read-only disk. Nothing to do.
    }
  }
}

export async function POST(request) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('avatar');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Please upload a JPG, PNG, WEBP, or GIF image.' },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'Image must be under 3MB.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { avatarUrl: true },
  });

  // 1) Upload the new photo.
  let uploaded;
  try {
    uploaded = await uploadToCloudinary(file, {
      folder: 'avatars',
      name: session.id,
      allowedFormats: ALLOWED_FORMATS,
    });
  } catch (err) {
    const { status, message } = describeUploadError(err);
    return NextResponse.json({ error: message }, { status });
  }

  // 2) Point the account at it. If this fails, don't leave an orphan upload.
  let updated;
  try {
    updated = await prisma.user.update({
      where: { id: session.id },
      data: { avatarUrl: uploaded.url },
      select: { avatarUrl: true },
    });
  } catch (err) {
    console.error('Avatar save failed:', err);
    await deleteFromCloudinary(uploaded.url);
    return NextResponse.json({ error: 'Could not save your photo. Please try again.' }, { status: 500 });
  }

  // 3) Only now remove the previous photo, so a failure above never leaves the
  //    user with no photo at all.
  await removeOldAvatar(user?.avatarUrl);

  return NextResponse.json({ message: 'Avatar updated', avatarUrl: updated.avatarUrl });
}

export async function DELETE(request) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { avatarUrl: true },
  });

  await prisma.user.update({
    where: { id: session.id },
    data: { avatarUrl: null },
  });

  await removeOldAvatar(user?.avatarUrl);

  return NextResponse.json({ message: 'Avatar removed' });
}
