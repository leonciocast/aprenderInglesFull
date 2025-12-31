import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { generateToken, hashToken } from '@/app/lib/auth';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';

export const runtime = 'nodejs';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: true });
    }

    const lookupSql = `
      SELECT id, name
      FROM users_aprenderIngles
      WHERE email = '${sqlString(email)}'
      LIMIT 1
    `;
    const rows = coerceRows(await runBooktolQuery(lookupSql));
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const token = generateToken(32);
    const tokenHash = hashToken(token);
    const insertSql = `
      INSERT INTO password_resets (user_id, token_hash, expires_at)
      VALUES (
        ${Number(user.id)},
        '${sqlString(tokenHash)}',
        NOW() + INTERVAL '2 hours'
      )
    `;
    await runBooktolQuery(insertSql);

    const resetUrl = `${getBaseUrl()}/auth/reset?token=${token}`;
    const transporter = createTransporter();
    const fromName = process.env.EMAIL_FROM_NAME || 'AprenderInglesFull';
    const fromEmail = process.env.EMAIL_FROM || 'info@aprenderinglesfull.com';

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: 'Reset your password',
      html: `
        <p>Hola${user.name ? ` ${user.name}` : ''},</p>
        <p>Usa este enlace para crear una nueva contraseña:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Este enlace expira en 2 horas.</p>
      `,
      text: `Hola${user.name ? ` ${user.name}` : ''},\n\nCrea una nueva contraseña aquí:\n${resetUrl}\n\nEste enlace expira en 2 horas.`,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Request reset error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
