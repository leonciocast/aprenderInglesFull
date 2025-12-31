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
    const courseId = await getIdParam(ctx);
    if (!Number.isFinite(courseId)) {
      return NextResponse.json({ error: 'Invalid course id' }, { status: 400 });
    }
    const body = await req.json();
    const title = String(body?.title || '').trim();
    const description = String(body?.description || '').trim();
    const coverImageUrl = String(body?.coverImageUrl || '').trim();

    const sql = `
      UPDATE courses
      SET
        title = ${title ? `'${sqlString(title)}'` : 'title'},
        description = ${description ? `'${sqlString(description)}'` : 'description'},
        cover_image_url = ${coverImageUrl ? `'${sqlString(coverImageUrl)}'` : 'cover_image_url'}
      WHERE id = ${courseId}
    `;
    await runBooktolQuery(sql);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Admin courses PATCH error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: any) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const courseId = await getIdParam(ctx);
    if (!Number.isFinite(courseId)) {
      return NextResponse.json({ error: 'Invalid course id' }, { status: 400 });
    }
    const sql = `
      DELETE FROM courses
      WHERE id = ${courseId}
    `;
    await runBooktolQuery(sql);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Admin courses DELETE error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
