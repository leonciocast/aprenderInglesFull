import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';
import { isAdminRequest } from '@/app/lib/admin-session';

export const runtime = 'nodejs';

const CONFIG_SLUG = '__config_manychat_test_mode';

function envDefault() {
  return (process.env.MANYCHAT_SEND_TEST_EMAIL || '').toLowerCase() === 'true';
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = `
      SELECT file
      FROM resource_mappings
      WHERE slug = '${sqlString(CONFIG_SLUG)}'
      LIMIT 1
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    const raw = String(rows[0]?.file || '').trim().toLowerCase();
    const enabled = raw ? raw === 'true' : envDefault();
    return NextResponse.json({ enabled });
  } catch (err: any) {
    console.error('ManyChat mode GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const enabled = Boolean(body?.enabled);

    const upsertSql = `
      INSERT INTO resource_mappings (slug, title, file)
      VALUES (
        '${sqlString(CONFIG_SLUG)}',
        'ManyChat test mode config',
        '${enabled ? 'true' : 'false'}'
      )
      ON CONFLICT (slug)
      DO UPDATE SET file = EXCLUDED.file
      RETURNING slug, file
    `;
    await runBooktolQuery(upsertSql);
    return NextResponse.json({ ok: true, enabled });
  } catch (err: any) {
    console.error('ManyChat mode POST error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
