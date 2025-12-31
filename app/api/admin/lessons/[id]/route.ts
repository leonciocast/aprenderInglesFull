import { NextRequest, NextResponse } from 'next/server';
import { runBooktolQuery, sqlString } from '@/app/lib/booktol';

export const runtime = 'nodejs';

function isAuthorized(req: NextRequest) {
  const password = req.headers.get('x-admin-password');
  return password && password === process.env.ADMIN_UPLOAD_PASSWORD;
}

async function getIdParam(ctx: any) {
  const params = ctx?.params && typeof ctx.params.then === 'function' ? await ctx.params : ctx?.params;
  return Number(params?.id);
}

export async function PATCH(req: NextRequest, ctx: any) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const lessonId = await getIdParam(ctx);
    if (!Number.isFinite(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson id' }, { status: 400 });
    }
    const body = await req.json();
    const title = String(body?.title || '').trim();
    const videoUrl = String(body?.videoUrl || '').trim();
    const lessonOrder = Number(body?.lessonOrder || 0);
    const notes = String(body?.notes || '').trim();

    const sql = `
      UPDATE lessons
      SET
        title = ${title ? `'${sqlString(title)}'` : 'title'},
        lesson_order = ${Number.isFinite(lessonOrder) && lessonOrder > 0 ? lessonOrder : 'lesson_order'},
        video_url = ${videoUrl ? `'${sqlString(videoUrl)}'` : 'video_url'},
        notes = ${notes ? `'${sqlString(notes)}'` : 'notes'}
      WHERE id = ${lessonId}
    `;
    await runBooktolQuery(sql);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Admin lessons PATCH error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: any) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const lessonId = await getIdParam(ctx);
    if (!Number.isFinite(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson id' }, { status: 400 });
    }
    const sql = `
      DELETE FROM lessons
      WHERE id = ${lessonId}
    `;
    await runBooktolQuery(sql);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Admin lessons DELETE error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
