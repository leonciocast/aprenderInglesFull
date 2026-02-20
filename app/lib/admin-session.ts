import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

const COOKIE_NAME = 'admin_session';

function getSecret() {
  return process.env.EMAILS_SESSION_SECRET || '';
}

export function buildSessionToken(password: string) {
  const secret = getSecret();
  if (!secret) return '';
  return createHmac('sha256', secret).update(password).digest('hex');
}

export function getSessionCookie(req: NextRequest) {
  return req.cookies.get(COOKIE_NAME)?.value || '';
}

export function isAdminRequest(req: NextRequest) {
  const password = req.headers.get('x-admin-password') || '';
  const expected = process.env.EMAILS_ADMIN_PASSWORD || '';
  if (password && expected && password === expected) return true;

  const secret = getSecret();
  const cookie = getSessionCookie(req);
  if (!secret || !cookie || !expected) return false;

  const expectedToken = buildSessionToken(expected);
  if (!expectedToken) return false;
  try {
    return timingSafeEqual(Buffer.from(cookie), Buffer.from(expectedToken));
  } catch {
    return false;
  }
}

export const AdminSession = {
  COOKIE_NAME,
};
