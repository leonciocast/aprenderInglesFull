import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';

export const runtime = 'nodejs';

function isAuthorized(req: NextRequest) {
  const password = req.headers.get('x-admin-password');
  return password && password === process.env.ADMIN_UPLOAD_PASSWORD;
}

async function getIdParam(ctx: any) {
  const params = ctx?.params && typeof ctx.params.then === 'function' ? await ctx.params : ctx?.params;
  return Number(params?.id);
}

export async function GET(req: NextRequest, ctx: any) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const courseId = await getIdParam(ctx);
    if (!Number.isFinite(courseId)) {
      return NextResponse.json({ error: 'Invalid course id' }, { status: 400 });
    }
    const sql = `
      SELECT id, course_id, title, lesson_order, video_url, notes, created_at
      FROM lessons
      WHERE course_id = ${courseId}
      ORDER BY lesson_order ASC, id ASC
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    return NextResponse.json({ lessons: rows });
  } catch (err: any) {
    console.error('Admin lessons GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: any) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const courseId = await getIdParam(ctx);
    if (!Number.isFinite(courseId)) {
      return NextResponse.json({ error: 'Invalid course id' }, { status: 400 });
    }
    const body = await req.json();
    const title = String(body?.title || '').trim();
    const videoUrl = String(body?.videoUrl || '').trim();
    const notes = String(body?.notes || '').trim();

    if (!title || !videoUrl) {
      return NextResponse.json({ error: 'Missing title or video URL' }, { status: 400 });
    }

    const orderSql = `
      SELECT COALESCE(MAX(lesson_order), 0) + 1 AS next_order
      FROM lessons
      WHERE course_id = ${courseId}
    `;
    const orderRows = coerceRows(await runBooktolQuery(orderSql));
    const nextOrder = Number(orderRows?.[0]?.next_order || 1);

    const sql = `
      INSERT INTO lessons (course_id, title, lesson_order, video_url, notes)
      VALUES (
        ${courseId},
        '${sqlString(title)}',
        ${Number.isFinite(nextOrder) ? nextOrder : 1},
        '${sqlString(videoUrl)}',
        ${notes ? `'${sqlString(notes)}'` : 'NULL'}
      )
      RETURNING id, course_id, title, lesson_order, video_url, notes, created_at
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    return NextResponse.json({ lesson: rows[0] });
  } catch (err: any) {
    console.error('Admin lessons POST error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
