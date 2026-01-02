import { NextRequest, NextResponse } from 'next/server';
import { coerceRows, runBooktolQuery } from '@/app/lib/booktol';
import { getUserFromRequest } from '@/app/lib/session';

export const runtime = 'nodejs';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function cleanMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(item => {
      const role: ChatMessage['role'] =
        item?.role === 'assistant' ? 'assistant' : 'user';
      const content = typeof item?.content === 'string' ? item.content.trim() : '';
      return { role, content };
    })
    .filter(item => item.content.length > 0)
    .slice(-12);
}

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
    const lessonId = Number(body?.lessonId);
    if (!Number.isFinite(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson id' }, { status: 400 });
    }

    const context = await getLessonContext(Number(user.id), lessonId);
    if (!context) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
    }

    const messages = cleanMessages(body?.messages);
    if (messages.length === 0) {
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
    }

    const systemPrompt = [
      'Eres un tutor de ingles para estudiantes hispanohablantes.',
      'Responde en espanol claro y breve.',
      'Cuando incluyas palabras o frases en ingles, envuelvelas en <en>...</en>.',
      'Enfocate en dudas de gramatica, vocabulario, pronunciacion y practica.',
      'Si la pregunta no es de ingles, redirige con amabilidad al tema.',
      `Curso: ${context.course_title || 'N/A'}.`,
      `Leccion actual: ${context.lesson_title || 'N/A'}.`,
    ].join(' ');

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 450,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
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
    console.error('Assistant POST error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
