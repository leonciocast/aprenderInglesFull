import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { hashPassword, hashToken, generateToken } from '@/app/lib/auth';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';

export const runtime = 'nodejs';

function isValidEmail(email: string) {
  return email.includes('@') && email.includes('.');
}

function getBaseUrl() {
  return process.env.AUTH_BASE_URL || 'https://aprenderinglesfull.com/uploader';
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SES_SMTP_HOST,
    port: Number(process.env.SES_SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SES_SMTP_USER,
      pass: process.env.SES_SMTP_PASS,
    },
  });
}

function extractPatternHint(message: string) {
  const match =
    message.match(/pattern[:\s]*["']?([^"'\\n]+)["']?/i) ||
    message.match(/expected pattern[:\s]*["']?([^"'\\n]+)["']?/i);
  if (match?.[1]) {
    return `Patrón requerido: ${match[1].trim()}`;
  }
  return 'Formato requerido: correo válido (nombre@dominio.com) y contraseña mínima de 8 caracteres.';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const name = String(body?.name || '').trim();
    const password = String(body?.password || '');

    if (!email || !password || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Correo o contraseña inválidos.' },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 },
      );
    }

    const lookupSql = `
      SELECT id, is_verified
      FROM users_aprenderIngles
      WHERE email = '${sqlString(email)}'
      LIMIT 1
    `;
    const lookup = coerceRows(await runBooktolQuery(lookupSql));
    const existing = lookup[0];

    if (existing?.is_verified) {
      return NextResponse.json(
        { error: 'Ese correo ya está registrado.' },
        { status: 409 },
      );
    }

    const passwordHash = hashPassword(password);
    let userId: number;

    if (existing?.id) {
      const updateSql = `
        UPDATE users_aprenderIngles
        SET name = ${name ? `'${sqlString(name)}'` : 'NULL'},
            password_hash = '${sqlString(passwordHash)}',
            is_verified = FALSE
        WHERE id = ${Number(existing.id)}
        RETURNING id
      `;
      const updated = coerceRows(await runBooktolQuery(updateSql));
      userId = Number(updated[0]?.id || existing.id);
    } else {
      const insertSql = `
        INSERT INTO users_aprenderIngles (email, name, password_hash, is_verified)
        VALUES (
          '${sqlString(email)}',
          ${name ? `'${sqlString(name)}'` : 'NULL'},
          '${sqlString(passwordHash)}',
          FALSE
        )
        RETURNING id
      `;
      const inserted = coerceRows(await runBooktolQuery(insertSql));
      userId = Number(inserted[0]?.id);
    }

    const token = generateToken(32);
    const tokenHash = hashToken(token);
    const insertTokenSql = `
      INSERT INTO email_verifications (user_id, token_hash, expires_at)
      VALUES (
        ${userId},
        '${sqlString(tokenHash)}',
        NOW() + INTERVAL '24 hours'
      )
    `;
    await runBooktolQuery(insertTokenSql);

    const verifyUrl = `${getBaseUrl()}/auth/verify?token=${token}`;

    const transporter = createTransporter();
    const fromName = process.env.EMAIL_FROM_NAME || 'AprenderInglesFull';
    const fromEmail = process.env.EMAIL_FROM || 'info@aprenderinglesfull.com';

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: 'Verify your account',
      html: `
        <p>Hola${name ? ` ${name}` : ''},</p>
        <p>Por favor verifica tu cuenta haciendo clic en este enlace:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>Este enlace expira en 24 horas.</p>
      `,
      text: `Hola${name ? ` ${name}` : ''},\n\nVerifica tu cuenta aquí:\n${verifyUrl}\n\nEste enlace expira en 24 horas.`,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Register error:', err);
    const rawMessage = err?.detail || err?.message || String(err);
    if (/pattern|check constraint|violates check constraint/i.test(rawMessage)) {
      return NextResponse.json(
        {
          error:
            'No pudimos crear tu cuenta por un formato inválido.',
          hint: extractPatternHint(rawMessage),
        },
        { status: 400 },
      );
    }
    if (/duplicate key|unique/i.test(rawMessage)) {
      return NextResponse.json(
        { error: 'Ese correo ya está registrado.' },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        error: 'No pudimos crear tu cuenta. Intenta de nuevo en unos minutos.',
        hint: rawMessage ? `Detalle técnico: ${rawMessage}` : undefined,
      },
      { status: 500 },
    );
  }
}
