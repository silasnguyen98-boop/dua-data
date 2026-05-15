import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { query } from "@/lib/db";
import { sendLoggedMail } from "@/lib/mail-logs";
import type { NewsletterSchedule } from "@/types/newsletter";

export type { NewsletterSchedule } from "@/types/newsletter";

export interface NewsletterContentItem {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  category?: string;
  createdAt?: string;
}

export interface NewsletterContent {
  resources: NewsletterContentItem[];
  jobs: NewsletterContentItem[];
  courses: NewsletterContentItem[];
}

export interface NewsletterRecipient {
  id?: string;
  userId: string;
  email: string;
  fullName: string;
  selected: boolean;
  wantsResources: boolean;
  lastSentBatchKey?: string | null;
  lastSentAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewsletterEmailPayload {
  fullName: string;
  email: string;
  content: NewsletterContent;
}

const DEFAULT_NEWSLETTER_SCHEDULE: NewsletterSchedule = {
  enabled: true,
  dayOfWeek: 6,
  hour: 7,
  minute: 0,
  timezone: "Asia/Ho_Chi_Minh",
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.NODE_ENV === "production" ? "https://duadata.net" : "http://localhost:3000")
  ).replace(/\/+$/, "");
}

function getDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getFriendlyDate(date = new Date()) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function getHoChiMinhDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const weekday = getPart("weekday");
  const hour = Number(getPart("hour") || 0);
  const minute = Number(getPart("minute") || 0);
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    dayOfWeek: dayMap[weekday] ?? 0,
    hour,
    minute,
  };
}

export function isNewsletterScheduleDue(schedule: NewsletterSchedule, date = new Date()) {
  const safeSchedule = {
    ...DEFAULT_NEWSLETTER_SCHEDULE,
    ...schedule,
  };

  if (!safeSchedule.enabled) return false;

  const current = getHoChiMinhDateParts(date);
  return (
    current.dayOfWeek === Number(safeSchedule.dayOfWeek) &&
    current.hour === Number(safeSchedule.hour) &&
    current.minute === Number(safeSchedule.minute)
  );
}

export function getDefaultNewsletterSchedule(): NewsletterSchedule {
  return DEFAULT_NEWSLETTER_SCHEDULE;
}

async function readFirebaseRows(path: string) {
  const snapshot = await get(ref(db, path));
  if (!snapshot.exists()) return [];
  const data = snapshot.val() as Record<string, Record<string, unknown>>;
  return Object.entries(data).map(([id, value]) => ({ id, ...(value || {}) }));
}

export async function getNewsletterContent(): Promise<NewsletterContent> {
  const [resourcesRows, jobsRows, { rows: coursesData }] = await Promise.all([
    readFirebaseRows("resource"),
    readFirebaseRows("Job"),
    query("SELECT id, slug, title, short_description, price, published, coming_soon, is_hidden, hide_price, created_at FROM courses ORDER BY created_at DESC"),
  ]);

  const resources = (resourcesRows as any[])
    .filter((item) => item.published !== false)
    .sort((a, b) => new Date(String(b.createdAt || b.created_at || 0)).getTime() - new Date(String(a.createdAt || a.created_at || 0)).getTime())
    .slice(0, 5)
    .map((item) => ({
      id: String(item.id),
      title: cleanText(item.title),
      url: `${getBaseUrl()}/resource/${cleanText(item.slug)}`,
      excerpt: cleanText(item.summary),
      category: cleanText(item.category),
      createdAt: cleanText(item.createdAt || item.created_at),
    }));

  const jobs = (jobsRows as any[])
    .filter((item) => item.published !== false)
    .sort((a, b) => new Date(String(b.createdAt || b.created_at || 0)).getTime() - new Date(String(a.createdAt || a.created_at || 0)).getTime())
    .slice(0, 5)
    .map((item) => ({
      id: String(item.id),
      title: cleanText(item.title) || cleanText(item.company),
      url: `${getBaseUrl()}/job/${cleanText(item.id)}`,
      excerpt: cleanText(item.summary),
      category: cleanText(item.workType),
      createdAt: cleanText(item.createdAt || item.created_at),
    }));

  const courses = ((coursesData || []) as any[])
    .filter((course) => course && course.published !== false && course.is_hidden !== true)
    .sort((a, b) => new Date(String(b.created_at || 0)).getTime() - new Date(String(a.created_at || 0)).getTime())
    .slice(0, 5)
    .map((course) => ({
      id: String((course as Record<string, unknown>).id || ""),
      title: cleanText((course as Record<string, unknown>).title),
      url: `${getBaseUrl()}/courses/${cleanText((course as Record<string, unknown>).slug)}`,
      excerpt: cleanText((course as Record<string, unknown>).short_description) || `Học phí: ${Number((course as Record<string, unknown>).price || 0).toLocaleString("vi-VN")}đ`,
      category: Number((course as Record<string, unknown>).price || 0) > 0 ? "Khóa có phí" : "Miễn phí",
      createdAt: cleanText((course as Record<string, unknown>).created_at),
    }));

  return { resources, jobs, courses };
}

function renderList(items: NewsletterContentItem[]) {
  if (items.length === 0) {
    return `<p style="margin:0;color:#6b7280">Dữ liệu đang được cập nhật.</p>`;
  }

  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb">
            <div style="font-weight:700;color:#0f172a;margin-bottom:4px"><a href="${escapeHtml(item.url)}" style="color:#0f172a;text-decoration:none">${escapeHtml(item.title)}</a></div>
            <div style="font-size:14px;color:#475569;line-height:1.6">${escapeHtml(item.excerpt || "")}</div>
          </td>
        </tr>
      `,
    )
    .join("");
}

export function buildNewsletterEmail(payload: NewsletterEmailPayload) {
  const dateLabel = getFriendlyDate();
  const subject = `DUA Edu Letter - ${dateLabel}`;
  const baseUrl = getBaseUrl();
  const safeName = escapeHtml(payload.fullName || "bạn");

  const text = [
    `Chào ${payload.fullName || "bạn"},`,
    "",
    `Đây là bản tin DUA Edu cập nhật cho ${dateLabel}.`,
    "",
    "Tài nguyên mới:",
    ...payload.content.resources.map((item) => `- ${item.title}: ${item.url}`),
    "",
    "Việc làm mới:",
    ...payload.content.jobs.map((item) => `- ${item.title}: ${item.url}`),
    "",
    "Khóa học mới:",
    ...payload.content.courses.map((item) => `- ${item.title}: ${item.url}`),
    "",
    "Cảm ơn bạn đã đồng hành cùng DUA Edu.",
    "",
    "DUA Edu",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:24px;overflow:hidden">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a,#065f46);color:#fff">
          <p style="margin:0 0 8px;text-transform:uppercase;letter-spacing:.18em;font-size:12px;color:#a7f3d0">DUA Edu Letter</p>
          <h2 style="margin:0;font-size:28px;line-height:1.25">Chào ${safeName}, đây là bản tin mới nhất</h2>
          <p style="margin:12px 0 0;color:#d1fae5">Cập nhật nhanh các tài nguyên, việc làm và khóa học mới từ DUA Edu.</p>
        </div>

        <div style="padding:32px">
          <div style="margin-bottom:28px">
            <h3 style="margin:0 0 12px;font-size:20px">Tài nguyên mới</h3>
            <table style="width:100%;border-collapse:collapse">${renderList(payload.content.resources)}</table>
          </div>

          <div style="margin-bottom:28px">
            <h3 style="margin:0 0 12px;font-size:20px">Việc làm mới</h3>
            <table style="width:100%;border-collapse:collapse">${renderList(payload.content.jobs)}</table>
          </div>

          <div style="margin-bottom:20px">
            <h3 style="margin:0 0 12px;font-size:20px">Khóa học mới từ DUA Edu</h3>
            <table style="width:100%;border-collapse:collapse">${renderList(payload.content.courses)}</table>
          </div>

          <div style="margin-top:20px;padding:16px 18px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px">
            <p style="margin:0;color:#14532d;line-height:1.7">
              Nếu bạn muốn xem đầy đủ nội dung, hãy truy cập <a href="${baseUrl}" style="color:#047857;text-decoration:none">${baseUrl}</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  return { subject, text, html };
}

export async function sendNewsletterMail(to: string, fullName: string, content: NewsletterContent) {
  const email = buildNewsletterEmail({ email: to, fullName, content });
  await sendLoggedMail({
    recipientEmail: to,
    mailType: "newsletter",
    subject: email.subject,
    text: email.text,
    html: email.html,
    body: email.html,
  });
}

export function newsletterBatchKey(date = new Date()) {
  return getDateKey(date);
}

export function newsletterBatchDateLabel(date = new Date()) {
  return getFriendlyDate(date);
}
