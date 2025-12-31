import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, hashToken } from '@/app/lib/auth';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body?.token || '');
    const password = String(body?.password || '');

    if (!token || password.length < 8) {
      return NextResponse.json({ error: 'Invalid token or password' }, { status: 400 });
    }

    const tokenHash = hashToken(token);
    const lookupSql = `
      SELECT id, user_id
      FROM password_resets
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

    const newHash = hashPassword(password);
    const updateSql = `
      UPDATE users_aprenderIngles
      SET password_hash = '${sqlString(newHash)}'
      WHERE id = ${Number(record.user_id)}
    `;
    await runBooktolQuery(updateSql);

    const consumeSql = `
      UPDATE password_resets
      SET consumed_at = NOW()
      WHERE id = ${Number(record.id)}
    `;
    await runBooktolQuery(consumeSql);

    const clearSessionsSql = `
      DELETE FROM sessions
      WHERE user_id = ${Number(record.user_id)}
    `;
    await runBooktolQuery(clearSessionsSql);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Reset error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
