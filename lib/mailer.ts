import { readFileSync } from "node:fs";
import { join } from "node:path";
import nodemailer from "nodemailer";
import { getAppUrl } from "@/lib/app-url";
import { CHURCH_NAME, CHURCH_SHORT_NAME } from "@/lib/church";

const LOGO_CID = "church-logo@stgeorge";

const CREAM = "#f7f3e9";
const DEEP_RED = "#8b1e3f";
const GOLD = "#d4af37";
const GOLD_DARK = "#997a15";
const WHITE = "#ffffff";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function fromAddress() {
  const configured = process.env.SMTP_FROM?.trim();

  if (configured?.includes("<")) {
    return configured;
  }

  return `${CHURCH_NAME} <${configured || process.env.SMTP_USER}>`;
}

function churchLogoSrc() {
  return `cid:${LOGO_CID}`;
}

function wrapChurchEmail({
  preheader,
  kicker,
  title,
  bodyHtml,
}: {
  preheader: string;
  kicker: string;
  title: string;
  bodyHtml: string;
}) {
  const siteUrl = getAppUrl();
  const logoSrc = churchLogoSrc();

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${CREAM};font-family:Tahoma,'Segoe UI',Arial,sans-serif;color:${DEEP_RED};direction:rtl;text-align:right;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${WHITE};border:1px solid ${GOLD};overflow:hidden;">
            <tr>
              <td style="height:8px;line-height:8px;font-size:0;background:${GOLD};">&nbsp;</td>
            </tr>
            <tr>
              <td align="center" style="background:${CREAM};padding:28px 24px 20px;">
                <img src="${logoSrc}" alt="${escapeHtml(CHURCH_NAME)}" width="96" height="141" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;width:96px;height:auto;max-width:96px;" />
                <p style="margin:16px 0 0;font-size:18px;font-weight:bold;line-height:1.7;color:${DEEP_RED};">
                  ${escapeHtml(CHURCH_NAME)}
                </p>
                <div style="margin:12px auto 0;width:64px;height:3px;background:${GOLD};"></div>
                <p style="margin:12px 0 0;font-size:14px;font-weight:bold;color:${GOLD_DARK};">
                  ${escapeHtml(kicker)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 0;">
                <h1 style="margin:0;font-size:22px;line-height:1.7;color:${DEEP_RED};text-align:center;">
                  ${escapeHtml(title)}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 28px;font-size:16px;line-height:1.9;color:${DEEP_RED};">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td align="center" style="background:${CREAM};padding:20px 24px;border-top:1px solid ${GOLD};">
                <p style="margin:0;font-size:13px;font-weight:bold;color:${DEEP_RED};">
                  ${escapeHtml(CHURCH_SHORT_NAME)}
                </p>
                <p style="margin:8px 0 0;font-size:12px;line-height:1.8;color:${DEEP_RED};">
                  المطرية — القاهرة
                </p>
                <p style="margin:8px 0 0;font-size:12px;">
                  <a href="${siteUrl}" style="color:${GOLD_DARK};text-decoration:none;font-weight:bold;">
                    ${siteUrl.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="height:8px;line-height:8px;font-size:0;background:${GOLD};">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function primaryButton(href: string, label: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto;">
      <tr>
        <td align="center" bgcolor="${DEEP_RED}" style="background:${DEEP_RED};border-radius:28px;">
          <a href="${href}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:${CREAM};text-decoration:none;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function inviteEmailTemplate(inviteUrl: string) {
  return wrapChurchEmail({
    preheader: `دعوة للانضمام كمسؤول إلى موقع ${CHURCH_NAME}`,
    kicker: "دعوة للانضمام كمسؤول",
    title: "إكمال إنشاء الحساب",
    bodyHtml: `
      <p style="margin:0 0 16px;">بركة الرب معكم،</p>
      <p style="margin:0 0 8px;">
        ندعوكم للانضمام كمسؤول على موقع ${escapeHtml(CHURCH_NAME)} لخدمة الكنيسة وأبنائها. من فضلكم أكملوا إنشاء الحساب خلال 48 ساعة من الزر التالي.
      </p>
      ${primaryButton(inviteUrl, "إكمال التسجيل")}
      <p style="margin:0 0 16px;font-size:13px;line-height:1.8;color:${DEEP_RED};">
        إذا لم يعمل الزر، انسخوا هذا الرابط إلى المتصفح:<br />
        <a href="${inviteUrl}" style="color:${GOLD_DARK};word-break:break-all;">${escapeHtml(inviteUrl)}</a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.8;">بركة القديس مارجرجس تكون معكم.</p>
    `,
  });
}

export function inviteEmailContent(inviteUrl: string) {
  return {
    fromName: CHURCH_NAME,
    subject: `دعوة للانضمام كمسؤول — ${CHURCH_NAME}`,
    text: `بركة الرب معكم، ندعوكم للانضمام كمسؤول على موقع ${CHURCH_NAME}. أكملوا إنشاء الحساب خلال 48 ساعة من هذا الرابط: ${inviteUrl}\n\nبركة القديس مارجرجس تكون معكم.`,
    html: inviteEmailTemplate(inviteUrl),
  };
}

export function prayerRequestEmailTemplate(name: string, message: string) {
  const safeName = escapeHtml(name);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

  return wrapChurchEmail({
    preheader: `طلب صلاة / افتقاد جديد من ${name}`,
    kicker: "خدمة الصلاة والافتقاد",
    title: "طلب صلاة / افتقاد جديد",
    bodyHtml: `
      <p style="margin:0 0 20px;">بركة الرب معكم، وصل طلب صلاة أو افتقاد جديد من خلال موقع الكنيسة:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border:1px solid ${GOLD};">
        <tr>
          <td style="padding:16px 18px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:bold;color:${GOLD_DARK};">الاسم</p>
            <p style="margin:0 0 16px;font-size:16px;font-weight:bold;line-height:1.8;">${safeName}</p>
            <p style="margin:0 0 6px;font-size:12px;font-weight:bold;color:${GOLD_DARK};">الرسالة / الطلب</p>
            <p style="margin:0;font-size:16px;line-height:1.9;">${safeMessage}</p>
          </td>
        </tr>
      </table>
      <p style="margin:20px 0 0;font-size:14px;line-height:1.8;">بركة الرب تكون مع الطالب ومع الكنيسة.</p>
    `,
  });
}

export async function sendChurchEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  await transporter.sendMail({
    from: fromAddress(),
    to,
    subject,
    text,
    html,
    attachments: [
      {
        filename: "logo.png",
        content: readFileSync(join(process.cwd(), "public", "logo.png")),
        cid: LOGO_CID,
        contentType: "image/png",
        contentDisposition: "inline",
      },
    ],
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
