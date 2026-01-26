import { NextRequest, NextResponse } from 'next/server';
import { generateToken, hashToken } from '@/app/lib/auth';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';
import {
  buildRefreshCookie,
  buildSessionCookie,
  clearSessionCookieForPath,
} from '@/app/lib/session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token') || '';
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const tokenHash = hashToken(token);
    const lookupSql = `
      SELECT id, user_id
      FROM email_verifications
      WHERE token_hash = '${sqlString(tokenHash)}'
        AND consumed_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `;
    const rows = coerceRows(await runBooktolQuery(lookupSql));
    const record = rows[0];
    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const userId = Number(record.user_id);

    const verifySql = `
      UPDATE users_aprenderIngles
      SET is_verified = TRUE
      WHERE id = ${userId}
    `;
    await runBooktolQuery(verifySql);

    const consumeSql = `
      UPDATE email_verifications
      SET consumed_at = NOW()
      WHERE id = ${Number(record.id)}
    `;
    await runBooktolQuery(consumeSql);

    const enrollSql = `
      INSERT INTO enrollments (user_id, course_id)
      SELECT ${userId}, c.id
      FROM courses c
      WHERE NOT EXISTS (
        SELECT 1
        FROM enrollments e
        WHERE e.user_id = ${userId}
          AND e.course_id = c.id
      )
    `;
    await runBooktolQuery(enrollSql);

    const sessionToken = generateToken(32);
    const sessionHash = hashToken(sessionToken);
    const userAgent = req.headers.get('user-agent') || '';
    const forwardedFor = req.headers.get('x-forwarded-for') || '';
    const ipAddress = forwardedFor.split(',')[0]?.trim() || '';

    const insertSessionSql = `
      INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip_address)
      VALUES (
        ${userId},
        '${sqlString(sessionHash)}',
        NOW() + INTERVAL '36500 days',
        ${userAgent ? `'${sqlString(userAgent)}'` : 'NULL'},
        ${ipAddress ? `'${sqlString(ipAddress)}'` : 'NULL'}
      )
    `;
    await runBooktolQuery(insertSessionSql);

    const res = NextResponse.json({ ok: true, refreshToken: sessionToken });
    res.headers.append('Set-Cookie', buildSessionCookie(sessionToken));
    res.headers.append('Set-Cookie', buildRefreshCookie(sessionToken));
    res.headers.append('Set-Cookie', clearSessionCookieForPath('/uploader'));
    return res;
  } catch (err: any) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
