import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery } from '@/app/lib/booktol';
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
      SELECT progress_percent, position_seconds, duration_seconds, completed_at
      FROM student_lesson_progress
      WHERE user_id = ${Number(user.id)} AND lesson_id = ${lessonId}
      LIMIT 1
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    const row = rows[0];

    return NextResponse.json({
      progressPercent: Number(row?.progress_percent || 0),
      positionSeconds: Number(row?.position_seconds || 0),
      durationSeconds: Number(row?.duration_seconds || 0),
      completedAt: row?.completed_at || null,
    });
  } catch (err: any) {
    console.error('Lesson progress GET error:', err);
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
    const lessonId = Number(body?.lessonId);
    const progressPercent = Number(body?.progressPercent);
    const positionSeconds = Number(body?.positionSeconds);
    const durationSeconds = Number(body?.durationSeconds);

    if (!Number.isFinite(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson id' }, { status: 400 });
    }

    if (!Number.isFinite(progressPercent) || !Number.isFinite(durationSeconds)) {
      return NextResponse.json({ error: 'Invalid progress payload' }, { status: 400 });
    }

    const enrolled = await assertEnrollment(Number(user.id), lessonId);
    if (!enrolled) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
    }

    const clampedPercent = Math.max(0, Math.min(100, progressPercent));
    const clampedPosition = Math.max(0, Math.floor(positionSeconds || 0));
    const clampedDuration = Math.max(0, Math.floor(durationSeconds || 0));

    const completedClause =
      clampedPercent >= 90 ? 'NOW()' : 'NULL';
    const sql = `
      INSERT INTO student_lesson_progress
        (user_id, lesson_id, progress_percent, position_seconds, duration_seconds, completed_at, updated_at)
      VALUES
        (
          ${Number(user.id)},
          ${lessonId},
          ${clampedPercent},
          ${clampedPosition},
          ${clampedDuration},
          ${completedClause},
          NOW()
        )
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET
        progress_percent = EXCLUDED.progress_percent,
        position_seconds = EXCLUDED.position_seconds,
        duration_seconds = EXCLUDED.duration_seconds,
        completed_at = CASE
          WHEN EXCLUDED.progress_percent >= 90 THEN COALESCE(student_lesson_progress.completed_at, NOW())
          ELSE student_lesson_progress.completed_at
        END,
        updated_at = NOW()
    `;

    await runBooktolQuery(sql);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Lesson progress POST error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
