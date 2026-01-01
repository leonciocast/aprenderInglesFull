import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery } from '@/app/lib/booktol';
import { getUserFromRequest } from '@/app/lib/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const quizId = Number(body?.quizId);
    if (!Number.isFinite(quizId)) {
      return NextResponse.json({ error: 'Invalid quiz id' }, { status: 400 });
    }

    const existingSql = `
      SELECT id, started_at, finished_at
      FROM quiz_attempt
      WHERE user_id = ${Number(user.id)} AND quiz_id = ${quizId} AND finished_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `;
    const existingRows = coerceRows(await runBooktolQuery(existingSql));
    let attempt = existingRows[0];

    if (!attempt) {
      const insertSql = `
        INSERT INTO quiz_attempt (user_id, quiz_id, started_at)
        VALUES (${Number(user.id)}, ${quizId}, NOW())
        RETURNING id, started_at, finished_at
      `;
      const inserted = coerceRows(await runBooktolQuery(insertSql));
      attempt = inserted[0];
    }

    const answersSql = `
      SELECT question_id, selected_option_id, is_correct
      FROM quiz_answer
      WHERE quiz_attempt_id = ${Number(attempt.id)}
    `;
    const answers = coerceRows(await runBooktolQuery(answersSql));

    return NextResponse.json({ attempt, answers });
  } catch (err: any) {
    console.error('Quiz attempt start error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
