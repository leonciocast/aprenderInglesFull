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

    const courseSql = `
      SELECT c.id, c.title, c.description, c.cover_image_url, c.created_at
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = ${Number(user.id)}
      ORDER BY c.created_at DESC
    `;
    const courseRows = coerceRows(await runBooktolQuery(courseSql));
    if (courseRows.length === 0) {
      return NextResponse.json({ courses: [] });
    }

    const courseIds = courseRows
      .map((row: any) => Number(row.id))
      .filter((id: number) => Number.isFinite(id));
    const courseIdList = courseIds.join(', ');

    const lessonSql = `
      SELECT id, course_id
      FROM lessons
      WHERE course_id IN (${courseIdList})
    `;
    const lessonRows = coerceRows(await runBooktolQuery(lessonSql));
    const lessonIds = lessonRows
      .map((row: any) => Number(row.id))
      .filter((id: number) => Number.isFinite(id));
    const lessonIdList = lessonIds.join(', ');

    const progressMap = new Map<number, number>();
    if (lessonIds.length > 0) {
      const progressSql = `
        SELECT lesson_id, progress_percent
        FROM student_lesson_progress
        WHERE user_id = ${Number(user.id)}
          AND lesson_id IN (${lessonIdList})
      `;
      const progressRows = coerceRows(await runBooktolQuery(progressSql));
      progressRows.forEach((row: any) => {
        const lessonId = Number(row.lesson_id);
        if (Number.isFinite(lessonId)) {
          progressMap.set(lessonId, Number(row.progress_percent || 0));
        }
      });
    }

    const lessonsByCourse = new Map<number, number[]>();
    lessonRows.forEach((row: any) => {
      const courseId = Number(row.course_id);
      const lessonId = Number(row.id);
      if (!Number.isFinite(courseId) || !Number.isFinite(lessonId)) return;
      const list = lessonsByCourse.get(courseId) || [];
      list.push(lessonId);
      lessonsByCourse.set(courseId, list);
    });

    const courses = courseRows.map((row: any) => {
      const courseId = Number(row.id);
      const lessonList = lessonsByCourse.get(courseId) || [];
      const lessonCount = lessonList.length;
      const total = lessonList.reduce((sum, lessonId) => {
        const pct = progressMap.get(lessonId) || 0;
        return sum + pct;
      }, 0);
      const progressPercent = lessonCount > 0 ? total / lessonCount : 0;
      return {
        ...row,
        lesson_count: lessonCount,
        progress_percent: progressPercent,
      };
    });

    return NextResponse.json({ courses });
  } catch (err: any) {
    console.error('Courses GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
