import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery } from '@/app/lib/booktol';
import { getUserFromRequest } from '@/app/lib/session';

export const runtime = 'nodejs';

async function getIdParam(ctx: any) {
  const params = ctx?.params && typeof ctx.params.then === 'function' ? await ctx.params : ctx?.params;
  return Number(params?.id);
}

export async function POST(req: NextRequest, ctx: any) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attemptId = await getIdParam(ctx);
    if (!Number.isFinite(attemptId)) {
      return NextResponse.json({ error: 'Invalid attempt id' }, { status: 400 });
    }

    const attemptSql = `
      SELECT id, quiz_id, finished_at
      FROM quiz_attempt
      WHERE id = ${attemptId} AND user_id = ${Number(user.id)}
      LIMIT 1
    `;
    const attemptRows = coerceRows(await runBooktolQuery(attemptSql));
    const attempt = attemptRows[0];
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    if (attempt.finished_at) {
      return NextResponse.json({ error: 'Attempt already finished' }, { status: 400 });
    }

    const totalSql = `
      SELECT COUNT(*) AS total
      FROM quiz_question
      WHERE quiz_id = ${Number(attempt.quiz_id)}
    `;
    const totalRows = coerceRows(await runBooktolQuery(totalSql));
    const totalQuestions = Number(totalRows[0]?.total || 0);

    const correctSql = `
      SELECT COUNT(*) AS total
      FROM quiz_answer
      WHERE quiz_attempt_id = ${attemptId} AND is_correct = TRUE
    `;
    const correctRows = coerceRows(await runBooktolQuery(correctSql));
    const totalCorrect = Number(correctRows[0]?.total || 0);

    const wrongSql = `
      SELECT COUNT(*) AS total
      FROM quiz_answer
      WHERE quiz_attempt_id = ${attemptId} AND is_correct = FALSE
    `;
    const wrongRows = coerceRows(await runBooktolQuery(wrongSql));
    const totalWrong = Number(wrongRows[0]?.total || 0);

    const scorePercent =
      totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const updateSql = `
      UPDATE quiz_attempt
      SET finished_at = NOW(),
          score_percent = ${scorePercent},
          total_correct = ${totalCorrect},
          total_wrong = ${totalWrong}
      WHERE id = ${attemptId}
    `;
    await runBooktolQuery(updateSql);

    return NextResponse.json({
      ok: true,
      scorePercent,
      totalCorrect,
      totalWrong,
      totalQuestions,
    });
  } catch (err: any) {
    console.error('Quiz finish error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
