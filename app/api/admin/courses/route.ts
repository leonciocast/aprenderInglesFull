import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';

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
      SELECT id, title, description, cover_image_url, created_at
      FROM courses
      ORDER BY created_at DESC
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    return NextResponse.json({ courses: rows });
  } catch (err: any) {
    console.error('Admin courses GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const title = String(body?.title || '').trim();
    const description = String(body?.description || '').trim();
    const coverImageUrl = String(body?.coverImageUrl || '').trim();

    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }

    const sql = `
      INSERT INTO courses (title, description, cover_image_url)
      VALUES (
        '${sqlString(title)}',
        ${description ? `'${sqlString(description)}'` : 'NULL'},
        ${coverImageUrl ? `'${sqlString(coverImageUrl)}'` : 'NULL'}
      )
      RETURNING id, title, description, cover_image_url, created_at
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    return NextResponse.json({ course: rows[0] });
  } catch (err: any) {
    console.error('Admin courses POST error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
