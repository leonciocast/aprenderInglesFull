import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';
import { getUserFromRequest } from '@/app/lib/session';

export const runtime = 'nodejs';

function parseLessonId(req: NextRequest) {
  const value = req.nextUrl.searchParams.get('lessonId');
  return value ? Number(value) : NaN;
}

async function assertEnrollment(userId: number, lessonId: number) {
  const sql = `
    SELECT l.id
    FROM lessons l
    JOIN enrollments e ON e.course_id = l.course_id
    WHERE l.id = ${lessonId} AND e.user_id = ${userId}
    LIMIT 1
  `;
  const rows = coerceRows(await runBooktolQuery(sql));
  return Boolean(rows[0]);
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lessonId = parseLessonId(req);
    if (!Number.isFinite(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson id' }, { status: 400 });
    }

    const enrolled = await assertEnrollment(Number(user.id), lessonId);
    if (!enrolled) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
    }

    const sql = `
      SELECT note
      FROM student_lesson_note
      WHERE user_id = ${Number(user.id)} AND lesson_id = ${lessonId}
      LIMIT 1
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    return NextResponse.json({ note: rows[0]?.note || '' });
  } catch (err: any) {
    console.error('Lesson notes GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const note = String(body?.note || '');
    const lessonId = Number(body?.lessonId);

    if (!Number.isFinite(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson id' }, { status: 400 });
    }

    if (note.length > 20000) {
      return NextResponse.json({ error: 'Note too long' }, { status: 400 });
    }

    const enrolled = await assertEnrollment(Number(user.id), lessonId);
    if (!enrolled) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
    }

    if (!note.trim()) {
      const deleteSql = `
        DELETE FROM student_lesson_note
        WHERE user_id = ${Number(user.id)} AND lesson_id = ${lessonId}
      `;
      await runBooktolQuery(deleteSql);
      return NextResponse.json({ ok: true });
    }

    const sql = `
      INSERT INTO student_lesson_note
        (user_id, lesson_id, note, created_at, updated_at)
      VALUES
        (
          ${Number(user.id)},
          ${lessonId},
          '${sqlString(note)}',
          NOW(),
          NOW()
        )
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET
        note = EXCLUDED.note,
        updated_at = NOW()
    `;

    await runBooktolQuery(sql);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Lesson notes POST error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
