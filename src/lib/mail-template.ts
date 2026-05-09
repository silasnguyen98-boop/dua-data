import { createAdminWriteClient } from "@/lib/supabase-server";
import type { Course } from "@/types/course";
import type { MailTemplateRecord } from "@/types/mail-template";

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
  payment_note: string;
  payment_qr: string;
  registered_at: string;
  school_year?: string;
  course_category?: string;
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

function formatCurrencyVn(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function wrapMailTemplateHtml(bodyHtml: string, context: MailTemplateContext) {
  const safeName = escapeHtml(context.full_name || "Bạn");
  const safeCourse = escapeHtml(context.course_title || "");
  const safeCourseLink = escapeHtml(context.course_link || getBaseUrl());
  const safeFanpage = escapeHtml(context.fanpage_link || "https://www.facebook.com/duadata");
  const safeRegisteredAt = escapeHtml(
    new Date(context.registered_at || new Date().toISOString()).toLocaleString("vi-VN", {
      dateStyle: "long",
      timeStyle: "short",
    })
  );

  return `
    <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:720px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:28px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,.08);">
          <div style="background:linear-gradient(135deg,#166534,#10b981);padding:28px 32px;color:#ffffff;">
            <div style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;opacity:.9;">Dứa Data</div>
            <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;">${safeCourse || "Xác nhận thông tin đăng ký"}</h1>
            <p style="margin:10px 0 0;font-size:15px;opacity:.92;">Mail xác nhận từ Dứa Data</p>
          </div>

          <div style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Chào <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#475569;">Dứa đã nhận được thông tin đăng ký khóa học <strong>${safeCourse}</strong>.</p>

            <div style="border:1px solid #e5e7eb;border-radius:22px;padding:24px;background:#fbfdff;margin:24px 0;">
              ${bodyHtml}
            </div>

            <div style="margin-top:28px;border-top:1px solid #e5e7eb;padding-top:18px;font-size:13px;line-height:1.7;color:#64748b;">
              <p style="margin:0 0 8px;">Khóa học: <a href="${safeCourseLink}" style="color:#059669;text-decoration:none;">${safeCourseLink}</a></p>
              <p style="margin:0 0 8px;">Fanpage hỗ trợ: <a href="${safeFanpage}" style="color:#059669;text-decoration:none;">${safeFanpage}</a></p>
              <p style="margin:0;">Thời gian đăng ký: ${safeRegisteredAt}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderMailTemplateHtml(templateBody: string, context: MailTemplateContext) {
  return wrapMailTemplateHtml(formatMailTemplate(templateBody, context), context);
}

export function buildMailTemplateContext(params: {
  fullName: string;
  email: string;
  phone: string;
  course: Course & { courseType?: string };
  learningNeeds: string;
  facebook: string;
  learnerGroup: number;
  registeredAt?: string;
}): MailTemplateContext {
  const courseLink = new URL(`/courses/${params.course.slug || params.course.id}`, getBaseUrl()).toString();
  const priceValue = Number(params.course.price || 0);

  return {
    full_name: params.fullName,
    email: params.email,
    phone: params.phone,
    course_title: params.course.title || "",
    course_slug: params.course.slug || params.course.id,
    course_price: formatCurrencyVn(priceValue),
    course_type: params.course.courseType || "",
    course_link: courseLink,
    fanpage_link: "https://www.facebook.com/duadata",
    learning_needs: params.learningNeeds || "",
    facebook: params.facebook || "",
    learner_group: String(params.learnerGroup || 0),
    payment_amount: formatCurrencyVn(priceValue),
    payment_note: `${params.email} - DUA Edu`,
    payment_qr:
      process.env.NEXT_PUBLIC_PAYMENT_QR_CODE_URL ||
      process.env.PAYMENT_QR_CODE_URL ||
      "https://i.ibb.co/WWpB9mvS/Screenshot-2026-05-09-at-08-36-45.png",
    registered_at: params.registeredAt || new Date().toISOString(),
    course_category: params.course.category || "",
  };
}

export async function loadActiveMailTemplate(courseId: string) {
  const supabase = createAdminWriteClient();
  const { data, error } = await supabase
    .from("course_mail_templates")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: String(data.id || ""),
    courseId: String(data.course_id || courseId),
    subject: String(data.subject || ""),
    body: String(data.body || ""),
    isActive: Boolean(data.is_active),
    createdAt: data.created_at ? String(data.created_at) : undefined,
    updatedAt: data.updated_at ? String(data.updated_at) : undefined,
  } as MailTemplateRecord;
}

export async function listMailTemplates() {
  const supabase = createAdminWriteClient();
  const [{ data: templates, error: templateError }, { data: courses, error: courseError }] = await Promise.all([
    supabase
      .from("course_mail_templates")
      .select("id, course_id, subject, body, is_active, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("courses").select("id, title, slug, category, course_type, price, hide_price").order("created_at", { ascending: false }),
  ]);

  if (templateError) throw templateError;
  if (courseError) throw courseError;

  const courseById = new Map((courses || []).map((course: Record<string, unknown>) => [String(course.id || ""), course]));

  return (templates || []).map((template: Record<string, unknown>) => {
    const course = courseById.get(String(template.course_id || "")) as Record<string, unknown> | undefined;
    return {
      id: String(template.id || ""),
      courseId: String(template.course_id || ""),
      courseTitle: course ? String(course.title || "") : "",
      courseSlug: course ? String(course.slug || "") : "",
      courseCategory: course ? String(course.category || "") : "",
      courseType: course ? String(course.course_type || "") : "",
      coursePrice: course ? Number(course.price || 0) : 0,
      courseHidePrice: course ? Boolean(course.hide_price) : false,
      subject: String(template.subject || ""),
      body: String(template.body || ""),
      isActive: Boolean(template.is_active),
      createdAt: template.created_at ? String(template.created_at) : undefined,
      updatedAt: template.updated_at ? String(template.updated_at) : undefined,
    };
  });
}

export async function upsertMailTemplate(input: {
  id?: string;
  courseId: string;
  subject: string;
  body: string;
  isActive: boolean;
}) {
  const supabase = createAdminWriteClient();

  if (input.id) {
    const { data, error } = await supabase
      .from("course_mail_templates")
      .update({
        course_id: input.courseId,
        subject: input.subject,
        body: input.body,
        is_active: input.isActive,
      })
      .eq("id", input.id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  const { data: existing, error: existingError } = await supabase
    .from("course_mail_templates")
    .select("id")
    .eq("course_id", input.courseId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("course_mail_templates")
      .update({
        subject: input.subject,
        body: input.body,
        is_active: input.isActive,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("course_mail_templates")
    .insert({
      course_id: input.courseId,
      subject: input.subject,
      body: input.body,
      is_active: input.isActive,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function findMailTemplateForCourse(courseId: string) {
  const supabase = createAdminWriteClient();
  const { data, error } = await supabase
    .from("course_mail_templates")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data as Record<string, unknown>;
}
