import type { NextRequest } from 'next/server';
import { hashToken } from './auth';
import { coerceRows, runBooktolQuery, sqlString } from './booktol';

export const SESSION_COOKIE_NAME = 'aif_session';
const SESSION_TTL_DAYS = 36500;

export function buildSessionCookie(token: string) {
  const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60;
  const secure = process.env.NODE_ENV === 'production';
  const domain = process.env.AUTH_COOKIE_DOMAIN;
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (domain) parts.push(`Domain=${domain}`);
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production';
  const domain = process.env.AUTH_COOKIE_DOMAIN;
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (domain) parts.push(`Domain=${domain}`);
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const sql = `
    SELECT u.id, u.email, u.name, u.is_verified
    FROM sessions s
    JOIN users_aprenderIngles u ON u.id = s.user_id
    WHERE s.token_hash = '${sqlString(tokenHash)}'
      AND s.expires_at > NOW()
    LIMIT 1
  `;
  const result = await runBooktolQuery(sql);
  const rows = coerceRows(result);
  return rows[0] || null;
}
