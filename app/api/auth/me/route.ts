import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/app/lib/session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('Me error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
