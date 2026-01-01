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

    const body = await req.json();
    const questionId = Number(body?.questionId);
    const optionId = Number(body?.optionId);
    if (!Number.isFinite(questionId) || !Number.isFinite(optionId)) {
      return NextResponse.json({ error: 'Invalid answer payload' }, { status: 400 });
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

    const optionSql = `
      SELECT is_correct
      FROM quiz_option
      WHERE id = ${optionId} AND question_id = ${questionId}
      LIMIT 1
    `;
    const optionRows = coerceRows(await runBooktolQuery(optionSql));
    const isCorrect = Boolean(optionRows[0]?.is_correct);

    const upsertSql = `
      INSERT INTO quiz_answer
        (quiz_attempt_id, question_id, selected_option_id, answered_at, is_correct)
      VALUES
        (${attemptId}, ${questionId}, ${optionId}, NOW(), ${isCorrect})
      ON CONFLICT (quiz_attempt_id, question_id)
      DO UPDATE SET
        selected_option_id = EXCLUDED.selected_option_id,
        answered_at = NOW(),
        is_correct = EXCLUDED.is_correct
    `;
    await runBooktolQuery(upsertSql);

    return NextResponse.json({ ok: true, isCorrect });
  } catch (err: any) {
    console.error('Quiz answer error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
