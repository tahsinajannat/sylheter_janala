import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

/**
 * Real SMTP when SMTP_HOST is set (Resend, Brevo, SES, Gmail app password...).
 * Otherwise a JSON transport: nothing is sent, the email is printed to the log,
 * which is exactly what you want while developing (the confirm link is in it).
 */
const transport = env.smtpEnabled
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

/** Returns the provider message id. Throws if sending fails. */
export async function sendMail({ to, subject, html, text, headers }) {
  const info = await transport.sendMail({ from: env.MAIL_FROM, to, subject, html, text, headers });
  if (!env.smtpEnabled) {
    console.log(`[mail:dev] to=${to}\n  subject: ${subject}\n  ${String(text).replace(/\n/g, '\n  ')}`);
  }
  return info.messageId;
}
