import { NextRequest, NextResponse } from "next/server";
import { isAppCheckEnforced, requireAppCheck } from "@/lib/app-check-server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
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

const MIN_FORM_AGE_MS = Number(process.env.REGISTER_MIN_FORM_AGE_MS || 800);

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function getCourseById(courseId: string) {
  const { rows } = await query(
    "SELECT id, slug, title, students, price, hide_price, course_type FROM courses WHERE id = $1 LIMIT 1",
    [courseId]
  );
  return rows[0] || null;
}

async function incrementCourseStudentsFallback(courseId: string, previousStudents: unknown) {
  const currentStudents = Number(previousStudents ?? 0);
  const nextStudents = currentStudents + 1;

  try {
    await query(
      "UPDATE courses SET students = $1 WHERE id = $2 AND (students = $3 OR (students IS NULL AND $3 IS NULL))",
      [nextStudents, courseId, previousStudents === null ? null : currentStudents]
    );
  } catch (error) {
    console.error("Increment course students fallback failed:", error);
  }
}

export async function GET() {
  const [{ rows: registrationsResult }, { rows: coursesResult }] = await Promise.all([
    query("SELECT * FROM course_registrations ORDER BY created_at DESC"),
    query("SELECT id, title, course_type, price FROM courses"),
  ]);

  const courseMetaById = new Map(
    (coursesResult || []).map((course) => [
      String(course.id),
      {
        title: String(course.title || ""),
        courseType: String(course.course_type || "online"),
        price: Number(course.price || 0),
      },
    ])
  );

  const registrations = (registrationsResult || []).map((row) => {
    const meta = courseMetaById.get(String(row.course_id || "")) || { title: "N/A", courseType: "online", price: 0 };
    return {
      ...mapRegistrationRowToStudent(row, meta.title),
      courseType: meta.courseType,
      price: meta.price,
    };
  });
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

    if (honeypot && typeof honeypot === "string" && honeypot.length > 0) {
      return NextResponse.json({ error: "Dữ liệu đăng ký không hợp lệ" }, { status: 400 });
    }

    const formAgeMs = Date.now() - formStartedAt;
    if (
      MIN_FORM_AGE_MS > 0 &&
      Number.isFinite(formStartedAt) &&
      formStartedAt > 0 &&
      formAgeMs >= 0 &&
      formAgeMs < MIN_FORM_AGE_MS
    ) {
      return NextResponse.json(
        { error: "Bạn thao tác quá nhanh, vui lòng thử lại sau vài giây" },
        { status: 429 },
      );
    }

    const course = await getCourseById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        {
          error: "Bạn cần đăng nhập để đăng ký khóa học",
          loginUrl: `/login?next=${encodeURIComponent(`/courses/${course.slug || course.id}?register=1`)}`,
        },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const { rows: duplicateRows } = await query(
      "SELECT id FROM course_registrations WHERE course_id = $1 AND user_id = $2 LIMIT 1",
      [courseId, userId]
    );
    const duplicate = duplicateRows[0];

    if (duplicate) {
      return NextResponse.json({ error: "Bạn đã đăng ký khóa học này rồi" }, { status: 409 });
    }

    const participantName =
      session.user.name ||
      session.user.email?.split("@")[0] ||
      "Tài khoản";
    const participantEmail = String(session.user.email || "").trim();

    const insert = buildRegistrationInsert({
      courseId: course.id,
      userId,
      participantName,
      participantEmail,
      phone,
      learnerGroup,
      facebook,
      learningNeeds,
    });

    const columns = Object.keys(insert);
    const values = Object.values(insert);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

    const { rows: savedRows } = await query(
      `INSERT INTO course_registrations (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    const savedRow = savedRows[0];

    if (!savedRow) {
      return NextResponse.json({ error: "Đăng ký thất bại" }, { status: 500 });
    }

    await incrementCourseStudentsFallback(course.id, course.students);

    let emailSent = false;
    let emailError = "";
    let mailLogId = "";

    try {
      const coursePrice = Number(course.price || 0);
      const courseHidePrice = Boolean((course as Record<string, unknown>).hide_price);
      const template = await findMailTemplateForCourse(course.id);
      const templateContext = buildMailTemplateContext({
        fullName: participantName,
        email: participantEmail,
        phone,
        course: {
          ...(course as Record<string, unknown>),
          courseType: String((course as Record<string, unknown>).course_type || ""),
        } as any,
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
