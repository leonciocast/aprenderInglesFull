import { NextRequest, NextResponse } from 'next/server';
import { AdminSession, buildSessionToken, isAdminRequest } from '@/app/lib/admin-session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const password = String(body?.password || '');
    const expected = process.env.EMAILS_ADMIN_PASSWORD || '';
    if (!expected || password !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = buildSessionToken(password);
    if (!token) {
      return NextResponse.json({ error: 'Missing session secret' }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(AdminSession.COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/uploader',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AdminSession.COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/uploader',
    maxAge: 0,
  });
  return res;
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: isAdminRequest(req) });
}
