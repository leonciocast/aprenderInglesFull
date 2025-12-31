import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery } from '@/app/lib/booktol';
import { getUserFromRequest } from '@/app/lib/session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = `
      SELECT c.id, c.title, c.description, c.cover_image_url, c.created_at
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = ${Number(user.id)}
      ORDER BY c.created_at DESC
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    return NextResponse.json({ courses: rows });
  } catch (err: any) {
    console.error('Courses GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
