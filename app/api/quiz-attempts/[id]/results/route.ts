import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery } from '@/app/lib/booktol';
import { getUserFromRequest } from '@/app/lib/session';

export const runtime = 'nodejs';

async function getIdParam(ctx: any) {
  const params = ctx?.params && typeof ctx.params.then === 'function' ? await ctx.params : ctx?.params;
  return Number(params?.id);
}

export async function GET(req: NextRequest, ctx: any) {
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
    if (!attempt.finished_at) {
      return NextResponse.json({ error: 'Attempt not finished' }, { status: 400 });
    }

    const questionSql = `
      SELECT id, text, question_order
      FROM quiz_question
      WHERE quiz_id = ${Number(attempt.quiz_id)}
      ORDER BY question_order ASC, id ASC
    `;
    const questionRows = coerceRows(await runBooktolQuery(questionSql));
    const questionIds = questionRows
      .map((row: any) => Number(row.id))
      .filter((id: number) => Number.isFinite(id));

    const answerSql = `
      SELECT question_id, selected_option_id, is_correct
      FROM quiz_answer
      WHERE quiz_attempt_id = ${attemptId}
    `;
    const answerRows = coerceRows(await runBooktolQuery(answerSql));
    const answersByQuestion = new Map<number, any>();
    answerRows.forEach((row: any) => {
      const questionId = Number(row.question_id);
      if (!Number.isFinite(questionId)) return;
      answersByQuestion.set(questionId, row);
    });

    let optionRows: any[] = [];
    if (questionIds.length > 0) {
      const optionSql = `
        SELECT id, question_id, text, is_correct
        FROM quiz_option
        WHERE question_id IN (${questionIds.join(', ')})
        ORDER BY id ASC
      `;
      optionRows = coerceRows(await runBooktolQuery(optionSql));
    }

    const correctByQuestion = new Map<number, any>();
    optionRows.forEach((row: any) => {
      if (!row?.is_correct) return;
      const questionId = Number(row.question_id);
      if (!Number.isFinite(questionId)) return;
      correctByQuestion.set(questionId, row);
    });

    const results = questionRows.map((row: any) => {
      const questionId = Number(row.id);
      const answer = answersByQuestion.get(questionId);
      const correct = correctByQuestion.get(questionId);
      return {
        question_id: row.id,
        question_text: row.text,
        selected_option_id: answer?.selected_option_id ?? null,
        is_correct: answer?.is_correct ?? null,
        correct_option_id: correct?.id ?? null,
        correct_option_text: correct?.text ?? null,
      };
    });

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error('Quiz results GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
