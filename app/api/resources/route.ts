import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';
import { isAdminRequest } from '@/app/lib/admin-session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = `
      SELECT id, slug, title, file, created_at
      FROM resource_mappings
      ORDER BY created_at DESC
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    return NextResponse.json({ rows });
  } catch (err: any) {
    console.error('Resources GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const slug = String(body?.slug || '').trim().toLowerCase();
    const title = String(body?.title || '').trim();
    const file = String(body?.file || '').trim();

    if (!slug || !title || !file) {
      return NextResponse.json({ error: 'Missing slug, title, or file.' }, { status: 400 });
    }

    const upsertSql = `
      INSERT INTO resource_mappings (slug, title, file)
      VALUES ('${sqlString(slug)}', '${sqlString(title)}', '${sqlString(file)}')
      ON CONFLICT (slug)
      DO UPDATE SET title = EXCLUDED.title, file = EXCLUDED.file
      RETURNING id, slug, title, file, created_at
    `;
    const rows = coerceRows(await runBooktolQuery(upsertSql));
    return NextResponse.json({ row: rows[0] });
  } catch (err: any) {
    console.error('Resources POST error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
