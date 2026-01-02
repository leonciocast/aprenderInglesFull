import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery } from '@/app/lib/booktol';
import { getUserFromRequest } from '@/app/lib/session';

export const runtime = 'nodejs';

async function getLessonContext(userId: number, lessonId: number) {
  const sql = `
    SELECT l.id, l.title AS lesson_title, c.title AS course_title
    FROM lessons l
    JOIN courses c ON c.id = l.course_id
    JOIN enrollments e ON e.course_id = c.id
    WHERE l.id = ${lessonId} AND e.user_id = ${userId}
    LIMIT 1
  `;
  const rows = coerceRows(await runBooktolQuery(sql));
  return rows[0];
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const word = String(body?.word || '').trim();
    const sentence = String(body?.sentence || '').trim();
    const lessonId = Number(body?.lessonId);

    if (!word) {
      return NextResponse.json({ error: 'Missing word' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
    }

    let contextInfo = '';
    if (Number.isFinite(lessonId)) {
      const lessonContext = await getLessonContext(Number(user.id), lessonId);
      if (!lessonContext) {
        return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
      }
      contextInfo = `Curso: ${lessonContext.course_title || 'N/A'}. Leccion: ${
        lessonContext.lesson_title || 'N/A'
      }.`;
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const systemPrompt = [
      'Eres un tutor de ingles para estudiantes hispanohablantes.',
      'Responde siempre en espanol.',
      'Explica el significado, uso y pronunciacion aproximada de la palabra.',
      'Da un ejemplo corto en ingles y su traduccion.',
      'Si hay una oracion de contexto, explica como cambia el sentido.',
      'Envuelve cualquier palabra o frase en ingles con <en>...</en>.',
      contextInfo,
    ]
      .filter(Boolean)
      .join(' ');

    const userPrompt = sentence
      ? `Palabra: "${word}". Oracion: "${sentence}".`
      : `Palabra: "${word}".`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 300,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message =
        data?.error?.message ||
        data?.message ||
        'OpenAI request failed.';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const reply = String(data?.choices?.[0]?.message?.content || '').trim();
    if (!reply) {
      return NextResponse.json({ error: 'Empty assistant reply' }, { status: 500 });
    }

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('Word helper POST error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
