import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';

export const runtime = 'nodejs';

function isAuthorized(req: NextRequest) {
  const password = req.headers.get('x-admin-password');
  return password && password === process.env.ADMIN_UPLOAD_PASSWORD;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const courseId = Number(body?.courseId || 0);
    const email = String(body?.email || '').trim().toLowerCase();
    const emails = Array.isArray(body?.emails) ? body.emails : [];

    if (!Number.isFinite(courseId) || (!email && emails.length === 0)) {
      return NextResponse.json({ error: 'Missing course or email' }, { status: 400 });
    }

    const emailList = emails.length ? emails : [email];
    const normalized = emailList
      .map((value: string) => String(value || '').trim().toLowerCase())
      .filter(Boolean);
    if (normalized.length === 0) {
      return NextResponse.json({ error: 'Missing emails' }, { status: 400 });
    }

    const emailSql = normalized.map((value: string) => `'${sqlString(value)}'`).join(',');
    const lookupSql = `
      SELECT id, email
      FROM users_aprenderIngles
      WHERE email IN (${emailSql})
    `;
    const users = coerceRows(await runBooktolQuery(lookupSql));
    if (users.length === 0) {
      return NextResponse.json({ error: 'Users not found' }, { status: 404 });
    }

    const values = users
      .map((user: any) => `(${Number(user.id)}, ${courseId})`)
      .join(', ');
    const insertSql = `
      INSERT INTO enrollments (user_id, course_id)
      VALUES ${values}
      ON CONFLICT (user_id, course_id) DO NOTHING
    `;
    await runBooktolQuery(insertSql);

    return NextResponse.json({ ok: true, enrolled: users.length });
  } catch (err: any) {
    console.error('Admin enrollments POST error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
