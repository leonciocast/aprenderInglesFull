import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

const COOKIE_NAME = 'uploader_session';

function getSecret() {
  return process.env.UPLOADER_SESSION_SECRET || process.env.EMAILS_SESSION_SECRET || '';
}

export function buildUploaderSessionToken(password: string) {
  const secret = getSecret();
  if (!secret) return '';
  return createHmac('sha256', secret).update(password).digest('hex');
}

export function getUploaderSessionCookie(req: NextRequest) {
  return req.cookies.get(COOKIE_NAME)?.value || '';
}

export function isUploaderRequest(req: NextRequest) {
  const password = req.headers.get('x-admin-password') || '';
  const expected = process.env.ADMIN_UPLOAD_PASSWORD || '';
  if (password && expected && password === expected) return true;

  const secret = getSecret();
  const cookie = getUploaderSessionCookie(req);
  if (!secret || !cookie || !expected) return false;

  const expectedToken = buildUploaderSessionToken(expected);
  if (!expectedToken) return false;
  try {
    return timingSafeEqual(Buffer.from(cookie), Buffer.from(expectedToken));
  } catch {
    return false;
  }
}

export const UploaderSession = {
  COOKIE_NAME,
};
