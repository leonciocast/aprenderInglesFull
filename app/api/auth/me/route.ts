import { NextRequest, NextResponse } from 'next/server';
import { hashToken } from '@/app/lib/auth';
import {
  buildSessionCookie,
  clearSessionCookieForPath,
  getUserFromRequest,
  REFRESH_COOKIE_NAME,
} from '@/app/lib/session';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      const authHeader = req.headers.get('authorization') || '';
      const bearerToken = authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : '';
      const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value || bearerToken;
      if (!refreshToken) {
        return NextResponse.json({ user: null }, { status: 401 });
      }
      const tokenHash = hashToken(refreshToken);
      const lookupSql = `
        SELECT u.id, u.email, u.name, u.is_verified, s.id AS session_id
        FROM sessions s
        JOIN users_aprenderIngles u ON u.id = s.user_id
        WHERE s.token_hash = '${sqlString(tokenHash)}'
          AND s.expires_at > NOW()
        LIMIT 1
      `;
      const rows = coerceRows(await runBooktolQuery(lookupSql));
      const refreshed = rows[0];
      if (!refreshed) {
        return NextResponse.json({ user: null }, { status: 401 });
      }
      const extendSql = `
        UPDATE sessions
        SET expires_at = NOW() + INTERVAL '36500 days'
        WHERE id = ${Number(refreshed.session_id)}
      `;
      await runBooktolQuery(extendSql);
      const res = NextResponse.json({ user: refreshed });
      res.headers.append('Set-Cookie', buildSessionCookie(refreshToken));
      res.headers.append('Set-Cookie', clearSessionCookieForPath('/uploader'));
      return res;
    }
    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('Me error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
