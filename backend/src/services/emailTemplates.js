import { env } from '../config/env.js';
import { stripHtml } from '../utils/html.js';

const SITE = { bn: 'সিলেটের জানালা', en: 'Sylheter Janala' };

export const confirmUrl = (lang, token) => `${env.APP_URL}/${lang}/subscribe/confirm?token=${encodeURIComponent(token)}`;
export const unsubscribePageUrl = (lang, token) => `${env.APP_URL}/${lang}/subscribe/unsubscribe?token=${encodeURIComponent(token)}`;
// RFC 8058 one-click endpoint (POST, handled by the API directly).
export const unsubscribeOneClickUrl = (token) => `${env.API_URL}/api/subscribers/unsubscribe?token=${encodeURIComponent(token)}`;

const wrap = (lang, inner) => `<!doctype html>
<html lang="${lang}"><body style="margin:0;background:#f4f4f5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#18181b">
<div style="max-width:560px;margin:0 auto;padding:24px">
  <div style="background:#fff;border-radius:12px;padding:28px">
    <div style="font-size:20px;font-weight:700;margin-bottom:16px">${SITE[lang]}</div>
    ${inner}
  </div>
</div></body></html>`;

export function confirmEmail(lang, token) {
  const url = confirmUrl(lang, token);
  if (lang === 'bn') {
    return {
      subject: `${SITE.bn}: আপনার ইমেইল নিশ্চিত করুন`,
      text: `সিলেটের জানালার নিউজলেটারে সাবস্ক্রাইব করার জন্য ধন্যবাদ।\nনিশ্চিত করতে এই লিংকে যান (৪৮ ঘণ্টা কার্যকর):\n${url}\n\nআপনি অনুরোধ না করে থাকলে এই ইমেইল উপেক্ষা করুন।`,
      html: wrap(
        'bn',
        `<p>নিউজলেটারে সাবস্ক্রাইব করার জন্য ধন্যবাদ। নিচের বাটনে ক্লিক করে আপনার ইমেইল নিশ্চিত করুন।</p>
         <p><a href="${url}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px">ইমেইল নিশ্চিত করুন</a></p>
         <p style="color:#71717a;font-size:13px">লিংকটি ৪৮ ঘণ্টা কার্যকর থাকবে। আপনি অনুরোধ না করে থাকলে এই ইমেইল উপেক্ষা করুন।</p>`,
      ),
    };
  }
  return {
    subject: `${SITE.en}: confirm your email`,
    text: `Thanks for subscribing to the ${SITE.en} newsletter.\nConfirm your email (link valid for 48 hours):\n${url}\n\nIf you didn't request this, ignore this email.`,
    html: wrap(
      'en',
      `<p>Thanks for subscribing to our newsletter. Please confirm your email address.</p>
       <p><a href="${url}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px">Confirm email</a></p>
       <p style="color:#71717a;font-size:13px">This link is valid for 48 hours. If you didn't request this, ignore this email.</p>`,
    ),
  };
}

/** Wrap a campaign body with the site frame + unsubscribe footer, and add one-click headers. */
export function newsletterEmail({ lang, subject, bodyHtml }, unsubscribeToken) {
  const page = unsubscribePageUrl(lang, unsubscribeToken);
  const footer =
    lang === 'bn'
      ? `আপনি আমাদের নিউজলেটারে সাবস্ক্রাইব করেছেন বলে এই ইমেইল পেয়েছেন। <a href="${page}">আনসাবস্ক্রাইব</a>`
      : `You are receiving this because you subscribed to our newsletter. <a href="${page}">Unsubscribe</a>`;
  return {
    subject,
    html: wrap(lang, `${bodyHtml}<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0"><p style="color:#71717a;font-size:12px">${footer}</p>`),
    text: `${stripHtml(bodyHtml)}\n\n--\n${lang === 'bn' ? 'আনসাবস্ক্রাইব' : 'Unsubscribe'}: ${page}`,
    headers: {
      'List-Unsubscribe': `<${unsubscribeOneClickUrl(unsubscribeToken)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}
