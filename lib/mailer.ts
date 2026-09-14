import { getAppUrl } from "@/lib/app-url";
import { CHURCH_LOGO, CHURCH_NAME } from "@/lib/church";

export function inviteEmailTemplate(inviteUrl: string) {
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="margin:0;padding:24px;background:#f7f3e9;font-family:Tahoma,Arial,sans-serif;color:#8b1e3f;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d4af37;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#8b1e3f;padding:24px;text-align:center;">
              <img src="${getAppUrl()}${CHURCH_LOGO}" alt="${CHURCH_NAME}" width="72" height="72" style="display:block;margin:0 auto 12px;background:#f7f3e9;border-radius:12px;" />
              <h1 style="margin:0;color:#f7f3e9;font-size:20px;">${CHURCH_NAME}</h1>
              <p style="margin:8px 0 0;color:#d4af37;font-size:14px;">دعوة للانضمام كمسؤول</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.8;">السلام عليكم ورحمة الله،</p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.8;">
                تمت دعوتك لإدارة موقع ${CHURCH_NAME}. اضغط على الزر التالي لإكمال إنشاء حساب المسؤول خلال 48 ساعة.
              </p>
              <p style="text-align:center;margin:28px 0;">
                <a href="${inviteUrl}" style="display:inline-block;background:#8b1e3f;color:#f7f3e9;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold;">
                  إكمال التسجيل
                </a>
              </p>
              <p style="margin:0;font-size:13px;line-height:1.8;color:#8b1e3f;">
                إذا لم يعمل الزر، انسخ هذا الرابط إلى المتصفح:<br />
                <a href="${inviteUrl}" style="color:#8b1e3f;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function inviteEmailContent(inviteUrl: string) {
  return {
    fromName: CHURCH_NAME,
    subject: `دعوة للانضمام كمسؤول — ${CHURCH_NAME}`,
    text: `السلام عليكم، تمت دعوتك لإدارة موقع ${CHURCH_NAME}. أكمل التسجيل من هذا الرابط خلال 48 ساعة: ${inviteUrl}`,
    html: inviteEmailTemplate(inviteUrl),
  };
}

export function prayerRequestEmailTemplate(name: string, message: string) {
  const safeName = escapeHtml(name);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="margin:0;padding:24px;background:#f7f3e9;font-family:Tahoma,Arial,sans-serif;color:#8b1e3f;direction:rtl;text-align:right;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d4af37;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#8b1e3f;padding:24px;text-align:center;">
              <img src="${getAppUrl()}${CHURCH_LOGO}" alt="${CHURCH_NAME}" width="72" height="72" style="display:block;margin:0 auto 12px;background:#f7f3e9;border-radius:12px;" />
              <h1 style="margin:0;color:#f7f3e9;font-size:20px;">طلب صلاة / افتقاد جديد</h1>
              <p style="margin:8px 0 0;color:#d4af37;font-size:14px;">${CHURCH_NAME}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#997a15;">الاسم</p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.8;">${safeName}</p>
              <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#997a15;">الرسالة / الطلب</p>
              <p style="margin:0;font-size:16px;line-height:1.9;">${safeMessage}</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
