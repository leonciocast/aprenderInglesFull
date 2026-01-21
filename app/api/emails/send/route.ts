import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

type Recipient = {
  name?: string;
  email?: string;
};

type SendPayload = {
  recipients: Recipient[];
  lessonFile: string;
  lessonTitle: string;
  message: string;
  subject?: string;
};

const DEFAULT_SUBJECT = 'Your lesson from AprenderInglesFull 📘';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function signUnsubscribe(email: string, secret?: string) {
  if (!secret) return '';
  return createHmac('sha256', secret).update(email).digest('hex');
}

function normalizeLessonFile(raw: string) {
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep original if it's not valid URI encoding.
  }
  const cleaned = decoded.replace(/[^\p{L}\p{M}\p{N} ._-]/gu, '');
  if (!cleaned || !cleaned.toLowerCase().endsWith('.pdf')) {
    throw new Error('Invalid lesson file. It must be a .pdf filename.');
  }
  return cleaned;
}

function buildHtmlEmail(opts: {
  safeName: string;
  lessonTitle: string;
  pdfUrlUtm: string;
  customMessageHtml: string;
  unsubscribeUrl: string;
}) {
  const logoUrl = 'https://cdn.aprenderinglesfull.com/logo_ingles.png';
  const instagramUrl = 'https://instagram.com/aprendeinglesfull';
  const youtubeUrl = 'https://youtube.com/@aprenderinglesfull';
  const facebookUrl = 'https://facebook.com/aprenderinglesfull';
  const year = new Date().getFullYear();

  return `<!doctype html>
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
                  Learn English with clarity, confidence, and fun.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 24px 8px 24px; font-family:Arial,sans-serif;">
                <h1 style="margin:0 0 12px 0; font-size:24px; color:#111827; text-align:left;">
                  Hi ${opts.safeName}! 🎉
                </h1>
                <p style="margin:0 0 12px 0; font-size:15px; color:#374151; line-height:1.6;">
                  Thank you for learning with <strong>AprenderInglesFull</strong>!
                  As promised, here is your PDF <strong>&quot;${opts.lessonTitle}&quot;</strong>.
                </p>
                <p style="margin:0 0 16px 0; font-size:15px; color:#374151; line-height:1.6;">
                  This resource will help you practice vocabulary, pronunciation, and
                  build strong English habits one step at a time.
                </p>
                ${opts.customMessageHtml}
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:0 24px 24px 24px; font-family:Arial,sans-serif;">
                <a href="${opts.pdfUrlUtm}"
                   style="display:inline-block; padding:14px 32px; background-color:#2563eb; color:#ffffff;
                          text-decoration:none; border-radius:9999px; font-weight:bold; font-size:16px;">
                  📘 Download your PDF
                </a>
                <p style="margin:12px 0 0 0; font-size:12px; color:#6b7280;">
                  If the button doesn’t work, copy and paste this link into your browser:<br>
                  <span style="word-break:break-all; color:#2563eb;">${opts.pdfUrlUtm}</span>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 24px 24px; font-family:Arial,sans-serif;">
                <p style="margin:0 0 10px 0; font-size:14px; color:#374151; line-height:1.6;">
                  Over the next days, I’ll send you short lessons, tips, and exercises
                  to help you speak more natural English in real life.
                </p>
                <p style="margin:0; font-size:14px; color:#374151; line-height:1.6;">
                  If you have any questions, just reply to this email — I read every message. 😊
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
                  © ${year} AprenderInglesFull. All rights reserved.<br>
                  You received this email because you requested a resource from AprenderInglesFull.
                  If you didn't request it, you can safely ignore this message.<br>
                  <a href="${opts.unsubscribeUrl}" style="color:#6b7280; text-decoration:underline;">
                    Unsubscribe
                  </a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildTextEmail(opts: {
  name: string;
  lessonTitle: string;
  pdfUrlUtm: string;
  message: string;
  unsubscribeUrl: string;
}) {
  const message = opts.message ? `\n\n${opts.message}\n\n` : '\n\n';
  return (
    `Hi ${opts.name},\n\n` +
    `Here is your PDF "${opts.lessonTitle}":\n${opts.pdfUrlUtm}${message}` +
    `Over the next days, I’ll send you short lessons, tips and exercises\n` +
    `to help you speak more natural English.\n\n` +
    `Best regards,\nTomás\nAprenderInglesFull.com\n\n` +
    `Unsubscribe: ${opts.unsubscribeUrl}\n\n` +
    `You received this email because you requested a resource from AprenderInglesFull.\n` +
    `If you didn't request it, you can ignore this message.`
  );
}

export async function POST(req: NextRequest) {
  try {
    const password = req.headers.get('x-admin-password');
    if (!password || password !== process.env.EMAILS_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await req.json()) as SendPayload;
    const recipients = (payload.recipients || [])
      .map(item => ({
        name: (item.name || 'Student').trim(),
        email: (item.email || '').trim(),
      }))
      .filter(item => item.email && item.email.includes('@'));

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipients' }, { status: 400 });
    }

    const lessonFile = normalizeLessonFile(payload.lessonFile || '');
    const lessonTitle = escapeHtml(payload.lessonTitle || 'Your English lesson');
    const messageText = (payload.message || '').trim();
    const safeMessage = escapeHtml(messageText);
    const customMessageHtml = safeMessage
      ? `<p style="margin:0 0 16px 0; font-size:15px; color:#374151; line-height:1.6;">${safeMessage.replace(/\n/g, '<br>')}</p>`
      : '';

    const downloadBase =
      process.env.LESSON_DOWNLOAD_URL ||
      'https://aprenderinglesfull.com/uploader/api/pdfs/download';
    const downloadUrl = new URL(downloadBase);
    downloadUrl.searchParams.set('file', lessonFile);
    downloadUrl.searchParams.set('utm_source', 'lesson_email');
    downloadUrl.searchParams.set('utm_medium', 'email');
    downloadUrl.searchParams.set('utm_campaign', lessonFile);
    const pdfUrlUtm = downloadUrl.toString();

    const transporter = nodemailer.createTransport({
      host: process.env.SES_SMTP_HOST,
      port: Number(process.env.SES_SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SES_SMTP_USER,
        pass: process.env.SES_SMTP_PASS,
      },
    });

    const fromName = process.env.EMAIL_FROM_NAME || 'AprenderInglesFull';
    const fromEmail = process.env.EMAIL_FROM || 'info@aprenderinglesfull.com';
    const replyTo = process.env.EMAIL_REPLY_TO || fromEmail;
    const unsubscribeMailbox = process.env.EMAIL_UNSUBSCRIBE_EMAIL || replyTo;
    const unsubscribeBase =
      process.env.UNSUBSCRIBE_URL_BASE ||
      'https://aprenderinglesfull.com/uploader/api/unsubscribe';
    const unsubscribeSecret = process.env.EMAILS_UNSUBSCRIBE_SECRET;
    const subject = (payload.subject || DEFAULT_SUBJECT).trim() || DEFAULT_SUBJECT;

    const results: { email: string; ok: boolean; error?: string }[] = [];

    for (const recipient of recipients) {
      const safeName = escapeHtml(recipient.name || 'Student');
      const unsubscribeUrl = (() => {
        const url = new URL(unsubscribeBase);
        if (recipient.email) {
          url.searchParams.set('email', recipient.email);
          const sig = signUnsubscribe(recipient.email, unsubscribeSecret);
          if (sig) {
            url.searchParams.set('sig', sig);
          }
        }
        return url.toString();
      })();
      const html = buildHtmlEmail({
        safeName,
        lessonTitle,
        pdfUrlUtm,
        customMessageHtml,
        unsubscribeUrl,
      });
      const text = buildTextEmail({
        name: recipient.name || 'Student',
        lessonTitle: payload.lessonTitle || 'Your English lesson',
        pdfUrlUtm,
        message: messageText,
        unsubscribeUrl,
      });

      try {
        await transporter.sendMail({
          from: `${fromName} <${fromEmail}>`,
          to: `${recipient.name || 'Student'} <${recipient.email}>`,
          replyTo,
          subject,
          html,
          text,
          headers: {
            'List-Unsubscribe': `<mailto:${unsubscribeMailbox}>, <${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });
        results.push({ email: recipient.email, ok: true });
      } catch (err: any) {
        results.push({
          email: recipient.email,
          ok: false,
          error: err?.message || String(err),
        });
      }

      await new Promise(resolve => setTimeout(resolve, 110));
    }

    return NextResponse.json({
      sent: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length,
      results,
    });
  } catch (err: any) {
    console.error('Email send error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
