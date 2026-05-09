import { NextRequest, NextResponse } from "next/server";
import { isAppCheckEnforced, requireAppCheck } from "@/lib/app-check-server";
import { createClient } from "@supabase/supabase-js";
import { createAdminWriteClient } from "@/lib/supabase-server";
import {
  buildConfirmationEmail,
  buildRegistrationInsert,
  mapRegistrationRowToStudent,
} from "@/lib/course-registration";
import { sendLoggedMail } from "@/lib/mail-logs";
import {
  buildMailTemplateContext,
  type MailTemplateContext,
  findMailTemplateForCourse,
} from "@/lib/mail-template";
import {
  formatMailTemplate,
  htmlToTextPreserveLineBreaks,
  renderMailTemplateHtml,
} from "@/lib/mail-template-renderer";

export const dynamic = "force-dynamic";

const MIN_FORM_AGE_MS = Number(process.env.REGISTER_MIN_FORM_AGE_MS || 2500);

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createSupabaseAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}

async function getCourseById(courseId: string) {
  const supabase = createAdminWriteClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, students, price, hide_price, course_type")
    .eq("id", courseId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function GET() {
  const supabase = createAdminWriteClient();
  const [registrationsResult, coursesResult] = await Promise.all([
    supabase
      .from("course_registrations")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("courses").select("id, title"),
  ]);

  if (registrationsResult.error) {
    console.error("GET /api/register error:", registrationsResult.error);
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }

  const courseTitleById = new Map(
    (coursesResult.data || []).map((course) => [String(course.id), String(course.title || "")])
  );

  const registrations = (registrationsResult.data || []).map((row) =>
    mapRegistrationRowToStudent(row, courseTitleById.get(String(row.course_id || "")) || "")
  );
  return NextResponse.json(registrations);
}

export async function POST(req: NextRequest) {
  try {
    const appCheck = await requireAppCheck(req);
    if (isAppCheckEnforced() && !appCheck) {
      return NextResponse.json({ error: "Invalid captcha token" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const courseId = normalizeText(body.courseId);
    const phone = normalizePhone(normalizeText(body.phone));
    const facebook = normalizeText(body.facebook);
    const learningNeeds = normalizeText(body.learningNeeds || body.expectations);
    const learnerGroup = Number.isFinite(Number(body.learnerGroup)) ? Number(body.learnerGroup) : 0;
    const honeypot = normalizeText(body.honeypot);
    const formStartedAt = Number(body.formStartedAt);

    if (!courseId || !phone || !learningNeeds) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ số điện thoại và nhu cầu học" },
        { status: 400 },
      );
    }

    if (typeof honeypot === "string" && honeypot.length > 0) {
      return NextResponse.json({ error: "Dữ liệu đăng ký không hợp lệ" }, { status: 400 });
    }

    if (Number.isFinite(formStartedAt) && Date.now() - formStartedAt < MIN_FORM_AGE_MS) {
      return NextResponse.json(
        { error: "Bạn thao tác quá nhanh, vui lòng thử lại sau vài giây" },
        { status: 429 },
      );
    }

    const course = await getCourseById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Bạn cần đăng nhập để đăng ký khóa học",
          loginUrl: `/login?next=${encodeURIComponent(`/courses/${course.slug || course.id}?register=1`)}`,
        },
        { status: 401 },
      );
    }

    const supabaseAuth = createSupabaseAuthClient();
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(accessToken);
    const authUser = userData.user;
    if (userError || !authUser) {
      return NextResponse.json(
        {
          error: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
          loginUrl: `/login?next=${encodeURIComponent(`/courses/${course.slug || course.id}?register=1`)}`,
        },
        { status: 401 },
      );
    }

    const supabase = createAdminWriteClient();
    const { data: duplicate, error: duplicateError } = await supabase
      .from("course_registrations")
      .select("id")
      .eq("course_id", courseId)
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (duplicateError) {
      console.error("Duplicate check failed:", duplicateError);
      return NextResponse.json({ error: "Không thể kiểm tra đăng ký trùng" }, { status: 500 });
    }

    if (duplicate) {
      return NextResponse.json({ error: "Bạn đã đăng ký khóa học này rồi" }, { status: 409 });
    }

    const participantName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split("@")[0] ||
      "Tài khoản";
    const participantEmail = String(authUser.email || "").trim();

    const insert = buildRegistrationInsert({
      courseId: course.id,
      userId: authUser.id,
      participantName,
      participantEmail,
      phone,
      learnerGroup,
      facebook,
      learningNeeds,
    });

    const { data: savedRow, error: insertError } = await supabase
      .from("course_registrations")
      .insert(insert)
      .select("*")
      .single();

    if (insertError || !savedRow) {
      console.error("Insert course_registration failed:", insertError);
      return NextResponse.json(
        {
          error:
            insertError?.message ||
            "Đăng ký thất bại",
          details: insertError?.details || "",
          hint: insertError?.hint || "",
          code: insertError?.code || "",
        },
        { status: 500 },
      );
    }

    let emailSent = false;
    let emailError = "";
    let mailLogId = "";

    try {
      const coursePrice = Number(course.price || 0);
      const courseHidePrice = Boolean((course as Record<string, unknown>).hide_price);
      const template = await findMailTemplateForCourse(course.id);
      const templateContext: MailTemplateContext = buildMailTemplateContext({
        fullName: participantName,
        email: participantEmail,
        phone,
        course: {
          ...(course as Record<string, unknown>),
          courseType: String((course as Record<string, unknown>).course_type || ""),
        } as Parameters<typeof buildMailTemplateContext>[0]["course"],
        learningNeeds,
        facebook,
        learnerGroup,
        registeredAt: new Date().toISOString(),
      });

      const fallbackEmailPayload = buildConfirmationEmail({
        participantName,
        participantEmail,
        courseTitle: course.title || "",
        courseSlug: course.slug || course.id,
        coursePrice,
        courseHidePrice,
        phone,
        facebook,
        learningNeeds,
        learnerGroup,
        registeredAt: new Date().toISOString(),
      });

      const templateSubject = template ? String(template.subject || "") : "";
      const templateBody = template ? String(template.body || "") : "";
      const subject = template ? formatMailTemplate(templateSubject || fallbackEmailPayload.subject, templateContext) : fallbackEmailPayload.subject;
      const renderedTemplateHtml = template ? renderMailTemplateHtml(templateBody || fallbackEmailPayload.html, templateContext) : "";
      const htmlBody = template ? renderedTemplateHtml : fallbackEmailPayload.html;
      const textBody = template ? htmlToTextPreserveLineBreaks(renderedTemplateHtml) : fallbackEmailPayload.text;

      const sentMail = await sendLoggedMail({
        registrationId: String(savedRow.id || ""),
        recipientEmail: participantEmail,
        mailType: coursePrice > 0 ? (courseHidePrice ? "course_paid_hidden_price_registration" : "course_paid_registration") : "course_free_registration",
        subject,
        text: textBody,
        html: htmlBody,
        body: htmlBody,
      });
      mailLogId = sentMail.logId;
      emailSent = true;
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Không thể gửi email xác nhận";
      console.error("Send confirmation email failed:", err);
    }

    return NextResponse.json(
      {
        success: true,
        registration: mapRegistrationRowToStudent(savedRow, course.title || ""),
        emailSent,
        emailError,
        mailLogId,
        message: emailSent
          ? `Chúc mừng bạn đã đăng ký thành công khóa học ${course.title || ""}!`
          : `Đã lưu đăng ký khóa học ${course.title || ""}, nhưng chưa gửi được email xác nhận.`,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/register error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Đăng ký thất bại",
      },
      { status: 500 },
    );
  }
}
