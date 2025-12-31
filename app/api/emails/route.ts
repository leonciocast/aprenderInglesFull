import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type BooktolAuthResponse = {
  token?: string;
  access_token?: string;
};

async function getBooktolToken() {
  const baseUrl = process.env.BOOKTOL_BASE_URL;
  const user = process.env.BOOKTOL_AUTH_USER;
  const pass = process.env.BOOKTOL_AUTH_PASS;

  if (!baseUrl || !user || !pass) {
    throw new Error('Missing Booktol credentials');
  }

  const basic = Buffer.from(`${user}:${pass}`).toString('base64');
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/auth`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'User-Agent': 'BooktolClient/1.0 (Next.js)',
      Accept: 'application/json',
    },
  });

  const data = (await res.json()) as BooktolAuthResponse;
  if (!res.ok) {
    throw new Error(`Booktol auth failed: ${res.status}`);
  }

  const token = data.access_token ?? data.token;
  if (!token) {
    throw new Error('Booktol auth response missing token');
  }

  return token;
}

async function runBooktolQuery(sql: string) {
  const baseUrl = process.env.BOOKTOL_BASE_URL;
  if (!baseUrl) {
    throw new Error('Missing Booktol base URL');
  }

  const token = await getBooktolToken();
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'BooktolClient/1.0 (Next.js)',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Booktol query failed: ${res.status}`);
  }

  return data;
}

export async function GET(req: NextRequest) {
  try {
    const password = req.headers.get('x-admin-password');
    if (!password || password !== process.env.EMAILS_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = `
      SELECT id, name, email, source, created_at
      FROM email_leads
      ORDER BY created_at DESC
      LIMIT 500
    `;

    const result = await runBooktolQuery(sql);

    const rows = Array.isArray(result)
      ? result
      : Array.isArray(result?.rows)
        ? result.rows
        : Array.isArray(result?.data)
          ? result.data
          : [];

    return NextResponse.json({ rows });
  } catch (err: any) {
    console.error('Emails API error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
