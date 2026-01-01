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

export async function PUT(req: NextRequest, ctx: any) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questionId = await getIdParam(ctx);
    if (!Number.isFinite(questionId)) {
      return NextResponse.json({ error: 'Invalid question id' }, { status: 400 });
    }

    const body = await req.json();
    const text = String(body?.text || '').trim();
    const options = Array.isArray(body?.options) ? body.options : [];
    const correctOptionId = Number(body?.correctOptionId);

    if (!text) {
      return NextResponse.json({ error: 'Missing question text' }, { status: 400 });
    }
    if (options.length !== 3 || options.some((opt: any) => !Number.isFinite(Number(opt?.id)) || !String(opt?.text || '').trim())) {
      return NextResponse.json({ error: 'Exactly 3 options with ids are required' }, { status: 400 });
    }
    if (!Number.isFinite(correctOptionId)) {
      return NextResponse.json({ error: 'Invalid correct option id' }, { status: 400 });
    }

    const updateQuestionSql = `
      UPDATE quiz_question
      SET text = '${sqlString(text)}'
      WHERE id = ${questionId}
    `;
    await runBooktolQuery(updateQuestionSql);

    for (const opt of options) {
      const optionId = Number(opt.id);
      const optionText = String(opt.text || '').trim();
      const updateOptionSql = `
        UPDATE quiz_option
        SET text = '${sqlString(optionText)}'
        WHERE id = ${optionId} AND question_id = ${questionId}
      `;
      await runBooktolQuery(updateOptionSql);
    }

    const resetCorrectSql = `
      UPDATE quiz_option
      SET is_correct = FALSE
      WHERE question_id = ${questionId}
    `;
    await runBooktolQuery(resetCorrectSql);

    const setCorrectSql = `
      UPDATE quiz_option
      SET is_correct = TRUE
      WHERE id = ${correctOptionId} AND question_id = ${questionId}
    `;
    await runBooktolQuery(setCorrectSql);

    const questionSql = `
      SELECT id, text, question_order
      FROM quiz_question
      WHERE id = ${questionId}
      LIMIT 1
    `;
    const questionRows = coerceRows(await runBooktolQuery(questionSql));
    const question = questionRows[0];

    const optionsSql = `
      SELECT id, question_id, text, is_correct
      FROM quiz_option
      WHERE question_id = ${questionId}
      ORDER BY id ASC
    `;
    const optionRows = coerceRows(await runBooktolQuery(optionsSql));

    return NextResponse.json({
      question: {
        id: question.id,
        text: question.text,
        order: question.question_order,
        options: optionRows.map((row: any) => ({
          id: row.id,
          text: row.text,
          is_correct: row.is_correct,
        })),
      },
    });
  } catch (err: any) {
    console.error('Admin quiz question PUT error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
