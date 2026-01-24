import { NextRequest, NextResponse } from 'next/server';
import { generateToken, hashToken, verifyPassword } from '@/app/lib/auth';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';
import {
  buildRefreshCookie,
  buildSessionCookie,
  clearSessionCookieForPath,
} from '@/app/lib/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Ingresa tu correo y contraseña.' },
        { status: 400 },
      );
    }

    const lookupSql = `
      SELECT id, password_hash, is_verified
      FROM users_aprenderIngles
      WHERE email = '${sqlString(email)}'
      LIMIT 1
    `;
    const rows = coerceRows(await runBooktolQuery(lookupSql));
    const user = rows[0];

    if (!user || !verifyPassword(password, String(user.password_hash || ''))) {
      return NextResponse.json(
        { error: 'Correo o contraseña incorrectos.' },
        { status: 401 },
      );
    }
    if (!user.is_verified) {
      return NextResponse.json(
        { error: 'Tu correo aún no está verificado. Revisa tu email.' },
        { status: 403 },
      );
    }

    const sessionToken = generateToken(32);
    const sessionHash = hashToken(sessionToken);
    const userAgent = req.headers.get('user-agent') || '';
    const forwardedFor = req.headers.get('x-forwarded-for') || '';
    const ipAddress = forwardedFor.split(',')[0]?.trim() || '';

    const insertSql = `
      INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip_address)
      VALUES (
        ${Number(user.id)},
        '${sqlString(sessionHash)}',
        NOW() + INTERVAL '36500 days',
        ${userAgent ? `'${sqlString(userAgent)}'` : 'NULL'},
        ${ipAddress ? `'${sqlString(ipAddress)}'` : 'NULL'}
      )
    `;
    await runBooktolQuery(insertSql);

    const res = NextResponse.json({ ok: true, refreshToken: sessionToken });
    res.headers.append('Set-Cookie', buildSessionCookie(sessionToken));
    res.headers.append('Set-Cookie', buildRefreshCookie(sessionToken));
    res.headers.append('Set-Cookie', clearSessionCookieForPath('/uploader'));
    return res;
  } catch (err: any) {
    console.error('Login error:', err);
    const rawMessage = err?.detail || err?.message || String(err);
    if (/pattern|check constraint|violates check constraint/i.test(rawMessage)) {
      return NextResponse.json(
        {
          error:
            'No pudimos iniciar sesión por un formato inválido.',
          hint:
            'Formato requerido: correo válido (nombre@dominio.com) y contraseña mínima de 8 caracteres.',
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        error: 'No pudimos iniciar sesión. Intenta de nuevo en unos minutos.',
        hint: rawMessage ? `Detalle técnico: ${rawMessage}` : undefined,
      },
      { status: 500 },
    );
  }
}
