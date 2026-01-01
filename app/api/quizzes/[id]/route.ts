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

    const quizId = await getIdParam(ctx);
    if (!Number.isFinite(quizId)) {
      return NextResponse.json({ error: 'Invalid quiz id' }, { status: 400 });
    }

    const quizSql = `
      SELECT q.id,
             q.title,
             q.description,
             q.course_id,
             q.lesson_id,
             c.title AS course_title,
             l.title AS lesson_title,
             COALESCE(q.course_id, l.course_id) AS resolved_course_id
      FROM quiz q
      LEFT JOIN lessons l ON l.id = q.lesson_id
      LEFT JOIN courses c ON c.id = COALESCE(q.course_id, l.course_id)
      WHERE q.id = ${quizId}
      LIMIT 1
    `;
    const quizRows = coerceRows(await runBooktolQuery(quizSql));
    const quiz = quizRows[0];
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const resolvedCourseId = Number(quiz.resolved_course_id);
    if (Number.isFinite(resolvedCourseId)) {
      const enrollSql = `
        SELECT id
        FROM enrollments
        WHERE user_id = ${Number(user.id)} AND course_id = ${resolvedCourseId}
        LIMIT 1
      `;
      const enrollRows = coerceRows(await runBooktolQuery(enrollSql));
      if (!enrollRows[0]) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Quiz is not linked to a course' }, { status: 403 });
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
        SELECT id, question_id, text
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
      list.push({ id: row.id, text: row.text });
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
    console.error('Quiz GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
