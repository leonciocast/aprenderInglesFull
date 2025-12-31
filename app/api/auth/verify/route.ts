import { NextRequest, NextResponse } from 'next/server';
import { hashToken } from '@/app/lib/auth';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';

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

    const verifySql = `
      UPDATE users_aprenderIngles
      SET is_verified = TRUE
      WHERE id = ${Number(record.user_id)}
    `;
    await runBooktolQuery(verifySql);

    const consumeSql = `
      UPDATE email_verifications
      SET consumed_at = NOW()
      WHERE id = ${Number(record.id)}
    `;
    await runBooktolQuery(consumeSql);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
