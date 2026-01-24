import { NextRequest, NextResponse } from 'next/server';
import { hashToken } from '@/app/lib/auth';
import { buildSessionCookie, clearSessionCookieForPath } from '@/app/lib/session';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body?.token || '');
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const tokenHash = hashToken(token);
    const lookupSql = `
      SELECT id, user_id
      FROM sessions
      WHERE token_hash = '${sqlString(tokenHash)}'
        AND expires_at > NOW()
      LIMIT 1
    `;
    const rows = coerceRows(await runBooktolQuery(lookupSql));
    const session = rows[0];
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const extendSql = `
      UPDATE sessions
      SET expires_at = NOW() + INTERVAL '36500 days'
      WHERE id = ${Number(session.id)}
    `;
    await runBooktolQuery(extendSql);

    const res = NextResponse.json({ ok: true });
    res.headers.append('Set-Cookie', buildSessionCookie(token));
    res.headers.append('Set-Cookie', clearSessionCookieForPath('/uploader'));
    return res;
  } catch (err: any) {
    console.error('Refresh error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
