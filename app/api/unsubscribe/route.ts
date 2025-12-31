import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { PutSuppressedDestinationCommand, SESv2Client } from '@aws-sdk/client-sesv2';

export const runtime = 'nodejs';

const ses = new SESv2Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

function signUnsubscribe(email: string, secret: string) {
  return createHmac('sha256', secret).update(email).digest('hex');
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function normalizeEmail(raw: string) {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) return '';
  return trimmed;
}

function getParamsFromUrl(req: NextRequest) {
  const url = new URL(req.url);
  return url.searchParams;
}

async function suppressEmail(email: string) {
  await ses.send(
    new PutSuppressedDestinationCommand({
      EmailAddress: email,
      Reason: 'COMPLAINT',
    }),
  );
}

export async function GET(req: NextRequest) {
  return handleUnsubscribe(req);
}

export async function POST(req: NextRequest) {
  return handleUnsubscribe(req);
}

async function handleUnsubscribe(req: NextRequest) {
  try {
    const urlParams = getParamsFromUrl(req);
    let emailRaw = urlParams.get('email');
    let sig = urlParams.get('sig');

    if (req.method === 'POST') {
      const bodyText = await req.text();
      const bodyParams = new URLSearchParams(bodyText);
      emailRaw = emailRaw || bodyParams.get('email');
      sig = sig || bodyParams.get('sig');
    }

    const email = emailRaw ? normalizeEmail(emailRaw) : '';

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const secret = process.env.EMAILS_UNSUBSCRIBE_SECRET || '';
    if (secret) {
      const expected = signUnsubscribe(email, secret);
      if (!sig || !safeEqual(sig, expected)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    try {
      await suppressEmail(email);
    } catch (err) {
      console.error('Unsubscribe suppression error:', err);
    }

    return NextResponse.json({ ok: true, email });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
