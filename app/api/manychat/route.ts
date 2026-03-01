import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { coerceRows, runBooktolQuery, sqlString } from '@/app/lib/booktol';

export const runtime = 'nodejs';

const RESOURCE_PDF_MAP: Record<string, string> = {
  'guia-maestra-linking': 'La Guía Maestra de Linking.pdf',
  '7-patrones-de-enlace': '7_Patrones_de_Enlace.pdf',
  '10-formas-like-it': '10 Formas de decir like.pdf',
};

const RESOURCE_TITLE_MAP: Record<string, string> = {
  'guia-maestra-linking': 'La Guía Maestra de Linking',
  '7-patrones-de-enlace': '7 Patrones de enlace',
  '10-formas-like-it': '10 formas de decir I like it',
};

function isValidEmail(email: string) {
  return email.includes('@') && email.includes('.');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeLeadName(raw: string) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  const hasUrl = /https?:\/\/|www\.|\.com|\.net|\.org|\.io|t\.me|bit\.ly/i.test(lower);
  const hasWalletSpam = /(bitcoin|btc|eth|balance|wallet|profit|trx|usdt|binance|coin)/i.test(
    lower,
  );
  const hasSuspiciousChars = /[<>`{}[\]|\\]/.test(trimmed);
  const hasEmojiFlood = /[\u{1F300}-\u{1FAFF}]/u.test(trimmed);

  if (hasUrl || hasWalletSpam || hasSuspiciousChars || hasEmojiFlood) {
    return '';
  }

  const cleaned = trimmed
    .replace(/\s+/g, ' ')
    .replace(/[^A-Za-zÀ-ÿ' -]/g, '')
    .trim();

  if (!cleaned) return '';
  if (cleaned.length < 2 || cleaned.length > 60) return '';
  return cleaned;
}

async function fetchResourceMapping(slug: string) {
  if (!slug) return null;
  const sql = `
    SELECT slug, title, file
    FROM resource_mappings
    WHERE slug = '${sqlString(slug)}'
    LIMIT 1
  `;
  const rows = coerceRows(await runBooktolQuery(sql));
  const row = rows[0];
  if (!row) return null;
  return {
    slug: String(row.slug || slug),
    title: String(row.title || '').trim(),
    file: String(row.file || '').trim(),
  };
}

async function getManychatTestMode() {
  const sql = `
    SELECT file
    FROM resource_mappings
    WHERE slug = '__config_manychat_test_mode'
    LIMIT 1
  `;
  const rows = coerceRows(await runBooktolQuery(sql));
  const raw = String(rows[0]?.file || '').trim().toLowerCase();
  if (!raw) return null;
  return raw === 'true';
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

async function sendResourceEmail(opts: {
  toEmail: string;
  name?: string;
  pdfUrl: string;
  lessonTitle: string;
}) {
  const fromName = process.env.EMAIL_FROM_NAME || 'AprenderInglesFull';
  const fromEmail = process.env.EMAIL_FROM || 'info@aprenderinglesfull.com';
  const subject = 'Tu PDF de AprenderInglesFull';
  const safeName = sanitizeLeadName(opts.name || '') || 'Student';
  const safeNameHtml = escapeHtml(safeName);

  const logoUrl = 'https://cdn.aprenderinglesfull.com/logo_ingles.png';
  const instagramUrl = 'https://instagram.com/aprendeinglesfull';
  const youtubeUrl = 'https://youtube.com/@aprenderinglesfull';
  const facebookUrl = 'https://facebook.com/aprenderinglesfull';
  const year = new Date().getFullYear();

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0; padding:0; background-color:#f3f4f6;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f3f4f6; padding:20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px; background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 8px 20px rgba(15,23,42,0.08);">
            <tr>
              <td align="center" style="padding:24px 24px 16px 24px; background:linear-gradient(135deg,#1d4ed8,#2563eb);">
                <img src="${logoUrl}" alt="AprenderInglesFull Logo"
                     style="max-width:180px; width:180px; display:block; margin:0 auto 10px auto;" />
                <div style="color:#e0e7ff; font-family:Arial,sans-serif; font-size:13px;">
                  Aprende inglés con claridad, confianza y diversión.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 24px 8px 24px; font-family:Arial,sans-serif;">
                <h1 style="margin:0 0 12px 0; font-size:24px; color:#111827; text-align:left;">
                  ¡Hola ${safeNameHtml}! 🎉
                </h1>
                <p style="margin:0 0 12px 0; font-size:15px; color:#374151; line-height:1.6;">
                  ¡Gracias por aprender con <strong>AprenderInglesFull</strong>!
                  Como prometimos, aquí tienes tu PDF <strong>&quot;${opts.lessonTitle}&quot;</strong>.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:0 24px 24px 24px; font-family:Arial,sans-serif;">
                <a href="${opts.pdfUrl}"
                   style="display:inline-block; padding:14px 32px; background-color:#2563eb; color:#ffffff;
                          text-decoration:none; border-radius:9999px; font-weight:bold; font-size:16px;">
                  📘 Descargar tu PDF
                </a>
                <p style="margin:12px 0 0 0; font-size:12px; color:#6b7280;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                  <span style="word-break:break-all; color:#2563eb;">${opts.pdfUrl}</span>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px;">
                <hr style="border:none; border-top:1px solid #e5e7eb; margin:0;">
              </td>
            </tr>

            <tr>
              <td style="padding:20px 24px; font-family:Arial,sans-serif; background-color:#f9fafb;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:4px 0;">
                      <a href="${instagramUrl}" style="text-decoration:none; display:flex; align-items:center;">
                        <img src="https://cdn.aprenderinglesfull.com/icons/instagram.png"
                             alt="Instagram" width="20" height="20"
                             style="vertical-align:middle; margin-right:6px;">
                        <span style="color:#2563eb; font-size:14px;">AprenderInglesFull</span>
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;">
                      <a href="${youtubeUrl}" style="text-decoration:none; display:flex; align-items:center;">
                        <img src="https://cdn.aprenderinglesfull.com/icons/youtube.png"
                             alt="YouTube" width="20" height="20"
                             style="vertical-align:middle; margin-right:6px;">
                        <span style="color:#2563eb; font-size:14px;">AprenderInglesFull</span>
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;">
                      <a href="${facebookUrl}" style="text-decoration:none; display:flex; align-items:center;">
                        <img src="https://cdn.aprenderinglesfull.com/icons/facebook.png"
                             alt="Facebook" width="20" height="20"
                             style="vertical-align:middle; margin-right:6px;">
                        <span style="color:#2563eb; font-size:14px;">AprenderInglesFull</span>
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:16px 0 0 0; font-size:11px; color:#9ca3af; line-height:1.5;">
                  © ${year} AprenderInglesFull. Todos los derechos reservados.<br>
                  Recibiste este correo porque solicitaste un recurso de AprenderInglesFull.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  const text =
    `Hola ${safeName},\n\n` +
    `Aquí tienes tu PDF "${opts.lessonTitle}":\n${opts.pdfUrl}\n\n` +
    `AprenderInglesFull\n`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: opts.toEmail,
    subject,
    html,
    text,
  });
}

async function readBody(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return req.json();
  }

  const text = await req.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    const params = new URLSearchParams(text);
    const obj: Record<string, string> = {};
    params.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
}

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.MANYCHAT_WEBHOOK_SECRET || '';
    if (expectedSecret) {
      const provided = req.headers.get('x-manychat-secret') || '';
      if (!provided || provided !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await readBody(req);
    const email = String(body?.email || body?.user_email || '').trim().toLowerCase();
    const rawName = String(body?.name || body?.full_name || '').trim();
    const name = sanitizeLeadName(rawName);
    const source = String(body?.source || 'manychat_instagram').trim();
    const resourceRaw =
      req.nextUrl.searchParams.get('resource') ||
      req.nextUrl.searchParams.get('pdf') ||
      body?.resource ||
      body?.pdf ||
      '';
    const resource = String(resourceRaw || '').trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const lookupSql = `
      SELECT id, email
      FROM email_leads
      WHERE LOWER(email) = '${sqlString(email.toLowerCase())}'
      LIMIT 1
    `;
    const lookupRows = coerceRows(await runBooktolQuery(lookupSql));
    const existingId = Number(lookupRows[0]?.id || 0);

    if (resource) {
      const dbMapping = await fetchResourceMapping(resource);
      const filename = dbMapping?.file || RESOURCE_PDF_MAP[resource];
      const lessonTitle =
        dbMapping?.title ||
        RESOURCE_TITLE_MAP[resource] ||
        (filename ? filename.replace(/\.pdf$/i, '') : '');
      if (filename) {
        const base = (process.env.AUTH_BASE_URL || 'https://aprenderinglesfull.com/uploader')
          .replace(/\/$/, '');
        const link = `${base}/api/pdfs/download?file=${encodeURIComponent(filename)}`;
        console.log(`ManyChat resource "${resource}" -> ${link}`);

        const testEmail = process.env.MANYCHAT_TEST_EMAIL || '';
        const dbTestMode = await getManychatTestMode().catch(() => null);
        const sendTest =
          dbTestMode === null
            ? (process.env.MANYCHAT_SEND_TEST_EMAIL || '').toLowerCase() === 'true'
            : dbTestMode;
        if (sendTest && testEmail) {
          await sendResourceEmail({
            toEmail: testEmail,
            name,
            pdfUrl: link,
            lessonTitle,
          });
          console.log(`ManyChat test email sent to ${testEmail}`);
        }

        const sendUser =
          (process.env.MANYCHAT_SEND_USER_EMAIL || '').toLowerCase() === 'true';
        if (sendUser && email) {
          await sendResourceEmail({
            toEmail: email,
            name,
            pdfUrl: link,
            lessonTitle,
          });
          console.log(`ManyChat resource email sent to ${email}`);
        }
      } else {
        console.log(`ManyChat resource "${resource}" has no PDF mapping yet.`);
      }
    }
    
    if (existingId) {
      return NextResponse.json(
        { ok: true, id: existingId, duplicate: true },
        { status: 200 },
      );
    }

    const insertSql = `
      INSERT INTO email_leads (name, email, source, resource)
      VALUES (
        ${name ? `'${sqlString(name)}'` : 'NULL'},
        '${sqlString(email)}',
        ${source ? `'${sqlString(source)}'` : 'NULL'},
        ${resource ? `'${sqlString(resource)}'` : 'NULL'}
      )
      RETURNING id
    `;
    const inserted = coerceRows(await runBooktolQuery(insertSql));
    return NextResponse.json({ ok: true, id: inserted[0]?.id });
  } catch (err: any) {
    console.error('ManyChat webhook error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
