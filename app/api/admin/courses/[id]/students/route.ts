import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery } from '@/app/lib/booktol';

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
      SELECT u.id, u.email, u.name, u.is_verified, e.created_at
      FROM enrollments e
      JOIN users_aprenderIngles u ON u.id = e.user_id
      WHERE e.course_id = ${courseId}
      ORDER BY e.created_at DESC
    `;
    const rows = coerceRows(await runBooktolQuery(sql));
    return NextResponse.json({ students: rows });
  } catch (err: any) {
    console.error('Admin course students GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
