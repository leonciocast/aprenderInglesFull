import { NextRequest, NextResponse } from 'next/server';
import { hashToken } from '@/app/lib/auth';
import { runBooktolQuery, sqlString } from '@/app/lib/booktol';
import {
  clearSessionCookie,
  clearSessionCookieForPath,
  SESSION_COOKIE_NAME,
} from '@/app/lib/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const tokenHash = hashToken(token);
      const sql = `
        UPDATE sessions
        SET expires_at = NOW() - INTERVAL '1 second'
        WHERE token_hash = '${sqlString(tokenHash)}'
      `;
      await runBooktolQuery(sql);
    }

    const res = NextResponse.json({ ok: true });
    res.headers.append('Set-Cookie', clearSessionCookie());
    res.headers.append('Set-Cookie', clearSessionCookieForPath('/uploader'));
    return res;
  } catch (err: any) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
