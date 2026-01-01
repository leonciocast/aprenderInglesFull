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

    const courseId = await getIdParam(ctx);
    if (!Number.isFinite(courseId)) {
      return NextResponse.json({ error: 'Invalid course id' }, { status: 400 });
    }

    const courseSql = `
      SELECT c.id, c.title, c.description, c.cover_image_url, c.created_at
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = ${Number(user.id)} AND c.id = ${courseId}
      LIMIT 1
    `;
    const courseRows = coerceRows(await runBooktolQuery(courseSql));
    const course = courseRows[0];
    if (!course) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
    }

    const lessonsSql = `
      SELECT id, course_id, title, lesson_order, video_url, notes, created_at
      FROM lessons
      WHERE course_id = ${courseId}
      ORDER BY lesson_order ASC, id ASC
    `;
    const lessonRows = coerceRows(await runBooktolQuery(lessonsSql));

    const lessonIds = lessonRows
      .map((row: any) => Number(row.id))
      .filter(id => Number.isFinite(id));

    let progressRows: any[] = [];
    if (lessonIds.length > 0) {
      const progressSql = `
        SELECT lesson_id, progress_percent, completed_at
        FROM student_lesson_progress
        WHERE user_id = ${Number(user.id)}
          AND lesson_id IN (${lessonIds.join(', ')})
      `;
      progressRows = coerceRows(await runBooktolQuery(progressSql));
    }

    const progressMap = new Map<number, { percent: number; completedAt: string | null }>();
    progressRows.forEach((row: any) => {
      const lessonId = Number(row.lesson_id);
      if (!Number.isFinite(lessonId)) return;
      progressMap.set(lessonId, {
        percent: Number(row.progress_percent || 0),
        completedAt: row.completed_at || null,
      });
    });

    const lessons = lessonRows.map((row: any) => {
      const lessonId = Number(row.id);
      const progress = progressMap.get(lessonId);
      return {
        ...row,
        progress_percent: progress?.percent ?? 0,
        completed_at: progress?.completedAt ?? null,
      };
    });

    return NextResponse.json({ course, lessons });
  } catch (err: any) {
    console.error('Course detail GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
