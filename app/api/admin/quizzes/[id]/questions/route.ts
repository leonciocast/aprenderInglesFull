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

export async function POST(req: NextRequest, ctx: any) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quizId = await getIdParam(ctx);
    if (!Number.isFinite(quizId)) {
      return NextResponse.json({ error: 'Invalid quiz id' }, { status: 400 });
    }

    const body = await req.json();
    const text = String(body?.text || '').trim();
    const options = Array.isArray(body?.options) ? body.options : [];
    const correctIndex = Number(body?.correctIndex);
    const providedOrder = Number(body?.order);

    if (!text) {
      return NextResponse.json({ error: 'Missing question text' }, { status: 400 });
    }
    const normalizedOptions = options.map((opt: any) =>
      typeof opt === 'string' ? opt.trim() : String(opt?.text || '').trim(),
    );

    if (normalizedOptions.length !== 3 || normalizedOptions.some((opt: string) => !opt)) {
      return NextResponse.json({ error: 'Exactly 3 options are required' }, { status: 400 });
    }
    if (!Number.isFinite(correctIndex) || correctIndex < 0 || correctIndex > 2) {
      return NextResponse.json({ error: 'Invalid correct option index' }, { status: 400 });
    }

    let order = providedOrder;
    if (!Number.isFinite(order)) {
      const orderSql = `
        SELECT COALESCE(MAX(question_order), 0) AS max_order
        FROM quiz_question
        WHERE quiz_id = ${quizId}
      `;
      const rows = coerceRows(await runBooktolQuery(orderSql));
      order = Number(rows[0]?.max_order || 0) + 1;
    }

    const insertQuestionSql = `
      INSERT INTO quiz_question (quiz_id, text, question_order)
      VALUES (${quizId}, '${sqlString(text)}', ${order})
      RETURNING id, quiz_id, text, question_order
    `;
    const questionRows = coerceRows(await runBooktolQuery(insertQuestionSql));
    const question = questionRows[0];

    const optionStatements = normalizedOptions.map((opt: string, idx: number) => {
      const isCorrect = idx === correctIndex ? 'TRUE' : 'FALSE';
      return `(${question.id}, '${sqlString(opt)}', ${isCorrect})`;
    });

    const insertOptionsSql = `
      INSERT INTO quiz_option (question_id, text, is_correct)
      VALUES ${optionStatements.join(', ')}
    `;
    await runBooktolQuery(insertOptionsSql);

    const optionsSql = `
      SELECT id, question_id, text, is_correct
      FROM quiz_option
      WHERE question_id = ${question.id}
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
    console.error('Admin quiz question POST error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
