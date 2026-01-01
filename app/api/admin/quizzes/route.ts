import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';

export const runtime = 'nodejs';

function isAuthorized(req: NextRequest) {
  const password = req.headers.get('x-admin-password');
  return password && password === process.env.ADMIN_UPLOAD_PASSWORD;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = `
      SELECT q.id,
             q.title,
             q.description,
             q.course_id,
             q.lesson_id,
             c.title AS course_title,
             l.title AS lesson_title,
             q.created_at
      FROM quiz q
      LEFT JOIN courses c ON c.id = q.course_id
      LEFT JOIN lessons l ON l.id = q.lesson_id
      ORDER BY q.created_at DESC
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    return NextResponse.json({ quizzes: rows });
  } catch (err: any) {
    console.error('Admin quizzes GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const title = String(body?.title || '').trim();
    const description = String(body?.description || '').trim();
    let courseId = Number(body?.courseId);
    const lessonId = Number(body?.lessonId);

    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }

    if (Number.isFinite(lessonId) && !Number.isFinite(courseId)) {
      const lookupSql = `
        SELECT course_id
        FROM lessons
        WHERE id = ${lessonId}
        LIMIT 1
      `;
      const rows = coerceRows(await runBooktolQuery(lookupSql));
      courseId = Number(rows[0]?.course_id);
    }

    const sql = `
      INSERT INTO quiz (title, description, course_id, lesson_id)
      VALUES (
        '${sqlString(title)}',
        ${description ? `'${sqlString(description)}'` : 'NULL'},
        ${Number.isFinite(courseId) ? courseId : 'NULL'},
        ${Number.isFinite(lessonId) ? lessonId : 'NULL'}
      )
      RETURNING id, title, description, course_id, lesson_id, created_at
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    return NextResponse.json({ quiz: rows[0] });
  } catch (err: any) {
    console.error('Admin quizzes POST error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
