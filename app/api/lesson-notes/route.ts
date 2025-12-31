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

function sqlString(value: string) {
  return value.replace(/'/g, "''");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
  const note = String(body?.note || '');
  const videoSrc = String(body?.videoSrc || '').trim();
  const videoTitle = String(body?.videoTitle || '').trim();
  const visitorId = String(body?.visitorId || '').trim();

    if (!note.trim() || !videoSrc || !visitorId) {
      return NextResponse.json({ error: 'Missing note or video source' }, { status: 400 });
    }

    if (note.length > 20000) {
      return NextResponse.json({ error: 'Note too long' }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') || '';
    const forwardedFor = req.headers.get('x-forwarded-for') || '';
    const ipAddress = forwardedFor.split(',')[0]?.trim() || '';

    const sql = `
      INSERT INTO lesson_notes
        (visitor_id, video_src, video_title, note, user_agent, ip_address)
      VALUES
        (
          '${sqlString(visitorId)}',
          '${sqlString(videoSrc)}',
          ${videoTitle ? `'${sqlString(videoTitle)}'` : 'NULL'},
          '${sqlString(note)}',
          ${userAgent ? `'${sqlString(userAgent)}'` : 'NULL'},
          ${ipAddress ? `'${sqlString(ipAddress)}'` : 'NULL'}
        )
      ON CONFLICT (visitor_id, video_src)
      DO UPDATE SET
        note = EXCLUDED.note,
        video_title = EXCLUDED.video_title,
        user_agent = EXCLUDED.user_agent,
        ip_address = EXCLUDED.ip_address
    `;

    await runBooktolQuery(sql);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Lesson notes API error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
