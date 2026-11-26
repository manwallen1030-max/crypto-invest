// Cloudinary storage for user uploads (avatars, deposit proofs, KYC documents).
//
// Why this exists: saving files under /public only works on a machine with a
// permanent disk. On Vercel and similar hosts the filesystem is temporary, so
// uploads would vanish. Cloudinary stores them permanently and serves them from
// its CDN. The database keeps saving a plain URL, so pages that show an image
// (<img src={avatarUrl}>) need no changes.
//
// No SDK is needed: this talks to Cloudinary's REST API with a signed request,
// so there is nothing new to install.
//
// Required environment variables (Cloudinary dashboard -> Settings -> API Keys):
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET
// ...or the single CLOUDINARY_URL=cloudinary://KEY:SECRET@CLOUD_NAME that
// Cloudinary shows on the same page. Optional: CLOUDINARY_FOLDER (default
// "vaultex") is the top-level folder the files are grouped under.

import crypto from 'crypto';

const API_BASE = process.env.CLOUDINARY_API_BASE || 'https://api.cloudinary.com';
const TIMEOUT_MS = 30_000;

export class CloudinaryError extends Error {
  constructor(message, { code = 'UPLOAD_FAILED' } = {}) {
    super(message);
    this.name = 'CloudinaryError';
    this.code = code;
  }
}

function getConfig() {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;

  if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
    const m = process.env.CLOUDINARY_URL.trim().match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (m) [apiKey, apiSecret, cloudName] = [m[1], m[2], m[3]];
  }

  if (!cloudName || !apiKey || !apiSecret) return null;
  const folder = (process.env.CLOUDINARY_FOLDER || 'vaultex').replace(/^\/+|\/+$/g, '');
  return { cloudName, apiKey, apiSecret, folder };
}

export function isCloudinaryConfigured() {
  return getConfig() !== null;
}

function requireConfig() {
  const cfg = getConfig();
  if (!cfg) {
    throw new CloudinaryError(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      { code: 'NOT_CONFIGURED' }
    );
  }
  return cfg;
}

// Cloudinary's signature: every parameter except file / cloud_name /
// resource_type / api_key, sorted by name, joined as k=v&k=v, with the API
// secret appended, then SHA-1 hashed.
function sign(params, apiSecret) {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
}

async function callApi(cfg, resourceType, action, fields, file) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && v !== '') form.append(k, String(v));
  }
  form.append('api_key', cfg.apiKey);
  if (file) form.append('file', new Blob([file.buffer], { type: file.mime }), 'upload');

  const res = await fetch(`${API_BASE}/v1_1/${cfg.cloudName}/${resourceType}/${action}`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  let json = null;
  try { json = await res.json(); } catch { /* non-JSON error body */ }

  if (!res.ok) {
    throw new CloudinaryError(json?.error?.message || `Cloudinary responded with status ${res.status}`);
  }
  return json;
}

/**
 * Upload one file and return { url, publicId }.
 *
 * @param file      a File/Blob from request.formData()
 * @param folder    sub-folder, e.g. "avatars", "deposits", "kyc"
 * @param name      readable prefix for the file name (usually the user id)
 * @param allowedFormats  e.g. "jpg,png,webp,pdf". Cloudinary checks the REAL
 *                  file contents against this list, not just the browser's
 *                  claimed type, so a renamed file is rejected.
 */
export async function uploadToCloudinary(file, { folder, name = 'file', allowedFormats } = {}) {
  const cfg = requireConfig();

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || 'application/octet-stream';

  // A random UUID in the name makes the URL impossible to guess.
  const publicId = `${cfg.folder}/${folder}/${name}-${crypto.randomUUID()}`;
  const timestamp = Math.floor(Date.now() / 1000);

  const params = { public_id: publicId, timestamp, allowed_formats: allowedFormats };
  const signature = sign(params, cfg.apiSecret);

  // resource_type "auto" lets Cloudinary decide (images and PDFs both work).
  const json = await callApi(
    cfg, 'auto', 'upload',
    { ...params, signature },
    { buffer, mime }
  );

  if (!json?.secure_url) throw new CloudinaryError('Cloudinary did not return a file URL.');
  return { url: json.secure_url, publicId: json.public_id };
}

/**
 * Work out which Cloudinary file a stored URL points to. Returns null for
 * anything that is not a Cloudinary URL for THIS account (e.g. old local
 * "/uploads/..." links), so we never try to delete something we don't own.
 */
export function parseCloudinaryUrl(url) {
  if (typeof url !== 'string') return null;
  const m = url.match(/^https?:\/\/res\.cloudinary\.com\/([^/]+)\/(image|raw|video)\/upload\/(?:[^/]+\/)*?v\d+\/(.+)$/);
  if (!m) return null;

  const cfg = getConfig();
  if (!cfg || m[1] !== cfg.cloudName) return null;

  let publicId = decodeURIComponent(m[3].split('?')[0]);
  // Image/video public IDs don't include the extension; raw files do.
  if (m[2] !== 'raw') publicId = publicId.replace(/\.[A-Za-z0-9]+$/, '');
  return { resourceType: m[2], publicId };
}

/**
 * Delete a previously uploaded file by its URL. Never throws: a failed clean-up
 * must not break the request that triggered it. Returns true if it was deleted.
 */
export async function deleteFromCloudinary(url) {
  try {
    const cfg = getConfig();
    const parsed = parseCloudinaryUrl(url);
    if (!cfg || !parsed) return false;

    const timestamp = Math.floor(Date.now() / 1000);
    const params = { public_id: parsed.publicId, timestamp, invalidate: 'true' };
    const json = await callApi(cfg, parsed.resourceType, 'destroy', { ...params, signature: sign(params, cfg.apiSecret) });
    return json?.result === 'ok';
  } catch (err) {
    console.error('[cloudinary] delete failed:', err.message);
    return false;
  }
}

/** Turn an upload error into an HTTP status + a message that is safe to show. */
export function describeUploadError(err) {
  console.error('[cloudinary] upload failed:', err?.message || err);
  if (err instanceof CloudinaryError && err.code === 'NOT_CONFIGURED') {
    return { status: 503, message: 'Image storage is not set up yet. Please contact support.' };
  }
  return { status: 502, message: 'We could not upload your file right now. Please try again.' };
}
