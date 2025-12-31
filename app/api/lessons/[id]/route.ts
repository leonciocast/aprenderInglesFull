import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery } from '@/app/lib/booktol';
import { getUserFromRequest } from '@/app/lib/session';

export const runtime = 'nodejs';

async function getIdParam(ctx: any) {
  const params = ctx?.params && typeof ctx.params.then === 'function' ? await ctx.params : ctx?.params;
  return Number(params?.id);
}

export async function GET(req: NextRequest, ctx: any) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lessonId = await getIdParam(ctx);
    if (!Number.isFinite(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson id' }, { status: 400 });
    }

    const sql = `
      SELECT l.id, l.course_id, l.title, l.lesson_order, l.video_url, l.notes
      FROM lessons l
      JOIN enrollments e ON e.course_id = l.course_id
      WHERE l.id = ${lessonId} AND e.user_id = ${Number(user.id)}
      LIMIT 1
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    const lesson = rows[0];
    if (!lesson) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
    }

    return NextResponse.json({ lesson });
  } catch (err: any) {
    console.error('Lesson GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
