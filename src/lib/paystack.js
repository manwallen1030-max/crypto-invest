const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE = 'https://api.paystack.co';

export async function initializeTransaction({ email, amount, reference, callback_url, metadata }) {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount,
      reference,
      callback_url,
      metadata,
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
    }),
  });
  return res.json();
}

export async function verifyTransaction(reference) {
  const res = await fetch(`${BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  return res.json();
}

export function verifyWebhookSignature(payload, signature) {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return hash === signature;
}