import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery } from '@/app/lib/booktol';

export const runtime = 'nodejs';

function isAuthorized(req: NextRequest) {
  const password = req.headers.get('x-admin-password');
  return password && password === process.env.ADMIN_UPLOAD_PASSWORD;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = `
      SELECT id, email, name, is_verified, created_at
      FROM users_aprenderIngles
      ORDER BY created_at DESC
      LIMIT 500
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    return NextResponse.json({ students: rows });
  } catch (err: any) {
    console.error('Admin students GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
