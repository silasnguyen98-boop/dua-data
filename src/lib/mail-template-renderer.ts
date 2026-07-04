export interface MailTemplateContext {
  full_name: string;
  email: string;
  phone: string;
  course_title: string;
  course_slug: string;
  course_price: string;
  course_type: string;
  course_link: string;
  fanpage_link: string;
  learning_needs: string;
  facebook: string;
  learner_group: string;
  payment_amount: string;
  amount_due: string;
  payment_note: string;
  payment_qr: string;
  registered_at: string;
  school_year?: string;
  course_category?: string;
  logId?: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatMailTemplate(template: string, context: MailTemplateContext) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, token) => {
    const value = context[token as keyof MailTemplateContext];
    return value == null ? "" : String(value);
  });
}

export function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function htmlToTextPreserveLineBreaks(html: string) {
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|section|article|header|footer|h1|h2|h3|h4|h5|h6|li|tr|table|blockquote)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeEmbeddedImages(html: string) {
  return html.replace(/<img\b([^>]*)\/?\s*>/gi, (_match, attrs) => {
    const attrText = String(attrs || "");
    const hasStyle = /\bstyle\s*=\s*["'][^"']*["']/i.test(attrText);
    const styleChunk =
      "display:block;margin:20px auto;width:100%;max-width:640px;aspect-ratio:16/9;object-fit:cover;border-radius:18px;";

    if (hasStyle) {
      return `<img${attrText.replace(/\bstyle\s*=\s*(["'])(.*?)\1/i, (_m, quote, styleValue) => {
        const merged = `${styleValue};${styleChunk}`;
        return ` style=${quote}${merged}${quote}`;
      })} />`;
    }

    return `<img${attrText} style="${styleChunk}" />`;
  });
}

function getBaseUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.SITE_URL ||
    "";

  if (configured) return configured.replace(/\/+$/, "");
  return process.env.NODE_ENV === "production" ? "https://duadata.net" : "http://localhost:3000";
}

function formatDateTimeVn(value?: string) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleString("vi-VN", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function wrapMailTemplateHtml(bodyHtml: string, context: MailTemplateContext) {
  const normalizedBodyHtml = normalizeEmbeddedImages(bodyHtml);
  const safeName = escapeHtml(context.full_name || "Bạn");
  const safeCourse = escapeHtml(context.course_title || "");
  const safeCourseLink = escapeHtml(context.course_link || getBaseUrl());
  const safeFanpage = escapeHtml(context.fanpage_link || "https://www.facebook.com/duadata");
  const safeYear = new Date().getFullYear();

  return `
    <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:720px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:28px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,.08);">
          <div style="background:linear-gradient(135deg,#166534,#10b981);padding:28px 32px;color:#ffffff;">
            <div style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;opacity:.9;">DUA Edu</div>
            <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;">${safeCourse || "Xác nhận thông tin đăng ký"}</h1>
            <p style="margin:10px 0 0;font-size:15px;opacity:.92;">Mail xác nhận từ DUA Edu</p>
          </div>

          <div style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Chào <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#475569;">DUA Edu đã nhận được thông tin đăng ký khóa học <strong>${safeCourse}</strong>.</p>

            <div style="border:1px solid #e5e7eb;border-radius:22px;padding:24px;background:#fbfdff;margin:24px 0;white-space:pre-wrap;">
              ${normalizedBodyHtml}
            </div>

            <div style="margin-top:28px;border-top:1px solid #e5e7eb;padding-top:18px;font-size:13px;line-height:1.7;color:#64748b;">
              <p style="margin:0 0 8px;">Khóa học: <a href="${safeCourseLink}" style="color:#059669;text-decoration:none;">${safeCourseLink}</a></p>
              <p style="margin:0 0 8px;">Fanpage hỗ trợ: <a href="${safeFanpage}" style="color:#059669;text-decoration:none;">${safeFanpage}</a></p>
              <p style="margin:0 0 8px;">Thời gian đăng ký: ${escapeHtml(formatDateTimeVn(context.registered_at))}</p>
              <p style="margin:0;">&copy; ${safeYear} DUA Edu. All rights reserved.</p>
            </div>
          </div>
        </div>
        ${context.logId ? `<img src="${getBaseUrl()}/api/mail/track/${context.logId}" width="1" height="1" style="display:none" />` : ""}
      </div>
    </div>
  `;
}

export function wrapGenericMailHtml(bodyHtml: string, subject: string, logId?: string) {
  const normalizedBodyHtml = normalizeEmbeddedImages(bodyHtml);
  const safeSubject = escapeHtml(subject || "Thông báo từ DUA Edu");
  const safeFanpage = "https://www.facebook.com/duadata";
  const safeYear = new Date().getFullYear();

  return `
    <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:720px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:28px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,.08);">
          <div style="background:linear-gradient(135deg,#166534,#10b981);padding:28px 32px;color:#ffffff;">
            <div style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;opacity:.9;">DUA Edu</div>
            <h1 style="margin:10px 0 0;font-size:24px;line-height:1.2;">${safeSubject}</h1>
          </div>

          <div style="padding:32px;">
            <div style="font-size:15px;line-height:1.7;color:#334155;white-space:pre-wrap;">
              ${normalizedBodyHtml}
            </div>

            <div style="margin-top:28px;border-top:1px solid #e5e7eb;padding-top:18px;font-size:13px;line-height:1.7;color:#64748b;">
              <p style="margin:0 0 8px;">Fanpage hỗ trợ: <a href="${safeFanpage}" style="color:#059669;text-decoration:none;">${safeFanpage}</a></p>
              <p style="margin:0;">&copy; ${safeYear} DUA Edu. All rights reserved.</p>
            </div>
          </div>
        </div>
        ${logId ? `<img src="${getBaseUrl()}/api/mail/track/${logId}" width="1" height="1" style="display:none" />` : ""}
      </div>
    </div>
  `;
}

export function renderMailTemplateHtml(templateBody: string, context: MailTemplateContext) {
  return wrapMailTemplateHtml(formatMailTemplate(templateBody, context), context);
}
