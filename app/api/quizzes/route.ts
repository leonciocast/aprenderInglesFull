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
      SELECT q.id,
             q.title,
             q.description,
             q.created_at,
             c.title AS course_title,
             l.title AS lesson_title
      FROM quiz q
      LEFT JOIN lessons l ON l.id = q.lesson_id
      LEFT JOIN courses c ON c.id = COALESCE(q.course_id, l.course_id)
      JOIN enrollments e
        ON e.course_id = COALESCE(q.course_id, l.course_id)
       AND e.user_id = ${Number(user.id)}
      ORDER BY q.created_at DESC
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    return NextResponse.json({ quizzes: rows });
  } catch (err: any) {
    console.error('Quizzes GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
