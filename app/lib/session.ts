import type { NextRequest } from 'next/server';
import { hashToken } from './auth';
import { coerceRows, runBooktolQuery, sqlString } from './booktol';

export const SESSION_COOKIE_NAME = 'aif_session';
export const REFRESH_COOKIE_NAME = 'aif_refresh';
const SESSION_TTL_DAYS = 36500;

export function buildSessionCookieForPath(token: string, path = '/') {
  const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60;
  const secure = process.env.NODE_ENV === 'production';
  const domain = process.env.AUTH_COOKIE_DOMAIN;
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    `Max-Age=${maxAge}`,
    `Expires=${expires}`,
    `Path=${path}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (domain) parts.push(`Domain=${domain}`);
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function buildSessionCookie(token: string) {
  return buildSessionCookieForPath(token, '/');
}

export function buildRefreshCookie(token: string, path = '/') {
  const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60;
  const secure = process.env.NODE_ENV === 'production';
  const domain = process.env.AUTH_COOKIE_DOMAIN;
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  const parts = [
    `${REFRESH_COOKIE_NAME}=${token}`,
    `Max-Age=${maxAge}`,
    `Expires=${expires}`,
    `Path=${path}`,
    'SameSite=Lax',
  ];
  if (domain) parts.push(`Domain=${domain}`);
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookieForPath(path = '/') {
  const secure = process.env.NODE_ENV === 'production';
  const domain = process.env.AUTH_COOKIE_DOMAIN;
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Max-Age=0',
    `Path=${path}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (domain) parts.push(`Domain=${domain}`);
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie() {
  return clearSessionCookieForPath('/');
}

export function clearRefreshCookie(path = '/') {
  const secure = process.env.NODE_ENV === 'production';
  const domain = process.env.AUTH_COOKIE_DOMAIN;
  const parts = [
    `${REFRESH_COOKIE_NAME}=`,
    'Max-Age=0',
    `Path=${path}`,
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
