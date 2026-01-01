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

    const quizId = await getIdParam(ctx);
    if (!Number.isFinite(quizId)) {
      return NextResponse.json({ error: 'Invalid quiz id' }, { status: 400 });
    }

    const quizSql = `
      SELECT id, title, description, course_id, lesson_id
      FROM quiz
      WHERE id = ${quizId}
      LIMIT 1
    `;
    const quizRows = coerceRows(await runBooktolQuery(quizSql));
    const quiz = quizRows[0];
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const questionSql = `
      SELECT id, quiz_id, text, question_order
      FROM quiz_question
      WHERE quiz_id = ${quizId}
      ORDER BY question_order ASC, id ASC
    `;
    const questionRows = coerceRows(await runBooktolQuery(questionSql));
    const questionIds = questionRows
      .map((row: any) => Number(row.id))
      .filter((id: number) => Number.isFinite(id));

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

    const optionsByQuestion = new Map<number, any[]>();
    optionRows.forEach((row: any) => {
      const questionId = Number(row.question_id);
      if (!Number.isFinite(questionId)) return;
      const list = optionsByQuestion.get(questionId) || [];
      list.push({ id: row.id, text: row.text, is_correct: row.is_correct });
      optionsByQuestion.set(questionId, list);
    });

    const questions = questionRows.map((row: any) => {
      const questionId = Number(row.id);
      return {
        id: row.id,
        text: row.text,
        order: row.question_order,
        options: optionsByQuestion.get(questionId) || [],
      };
    });

    return NextResponse.json({ quiz, questions });
  } catch (err: any) {
    console.error('Admin quiz GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
