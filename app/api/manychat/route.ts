import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';

export const runtime = 'nodejs';

function isValidEmail(email: string) {
  return email.includes('@') && email.includes('.');
}

async function readBody(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return req.json();
  }

  const text = await req.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    const params = new URLSearchParams(text);
    const obj: Record<string, string> = {};
    params.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
}

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.MANYCHAT_WEBHOOK_SECRET || '';
    if (expectedSecret) {
      const provided = req.headers.get('x-manychat-secret') || '';
      if (!provided || provided !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await readBody(req);
    const email = String(body?.email || body?.user_email || '').trim().toLowerCase();
    const name = String(body?.name || body?.full_name || '').trim();
    const source = String(body?.source || 'manychat_instagram').trim();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const lookupSql = `
      SELECT id, email
      FROM email_leads
      WHERE LOWER(email) = '${sqlString(email.toLowerCase())}'
      LIMIT 1
    `;
    const lookupRows = coerceRows(await runBooktolQuery(lookupSql));
    const existingId = Number(lookupRows[0]?.id || 0);

    if (existingId) {
      return NextResponse.json(
        { error: 'Email already exists', id: existingId },
        { status: 409 },
      );
    }

    const insertSql = `
      INSERT INTO email_leads (name, email, source)
      VALUES (
        ${name ? `'${sqlString(name)}'` : 'NULL'},
        '${sqlString(email)}',
        ${source ? `'${sqlString(source)}'` : 'NULL'}
      )
      RETURNING id
    `;
    const inserted = coerceRows(await runBooktolQuery(insertSql));
    return NextResponse.json({ ok: true, id: inserted[0]?.id });
  } catch (err: any) {
    console.error('ManyChat webhook error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
