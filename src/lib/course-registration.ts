export interface CourseRegistrationRow {
  id: string;
  course_id?: string;
  user_id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  facebook?: string;
  note?: string;
  learner_group?: number | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CourseRegistrationInsert {
  course_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  facebook: string;
  note: string;
  learner_group: number;
  status: string | null;
  created_at: string;
  updated_at: string;
  source: string;
}

export interface CourseRegistrationStudentView {
  id: string;
  fullName: string;
  birthday: string;
  phone: string;
  learnerGroup: number;
  email: string;
  referralCode: string;
  expectations: string;
  courseId: string;
  courseName: string;
  registeredAt: string;
  facebook: string;
  userId: string;
  status: string;
}

export interface RegistrationEmailPayload {
  participantName: string;
  participantEmail: string;
  courseTitle: string;
  courseSlug: string;
  coursePrice: number;
  courseHidePrice?: boolean;
  phone: string;
  learnerGroup: number;
  facebook?: string;
  learningNeeds: string;
  registeredAt: string;
}

function toText(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPublicSiteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.SITE_URL ||
    "";

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  return process.env.NODE_ENV === "production"
    ? "https://duadata.net"
    : "http://localhost:3000";
}

function formatCurrencyVn(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

function buildPaymentNote(payload: RegistrationEmailPayload) {
  const emailPart = payload.participantEmail.trim();
  const brandPart = "DUA Edu";

  return `${emailPart} - ${brandPart}`.trim();
}

export function normalizeRegistrationName(row: Partial<CourseRegistrationRow>) {
  return (
    toText(row.full_name).trim() ||
    toText(row.email).split("@")[0] ||
    "Ẩn danh"
  );
}

export function normalizeRegistrationEmail(row: Partial<CourseRegistrationRow>) {
  return toText(row.email).trim();
}

export function mapRegistrationRowToStudent(
  row: CourseRegistrationRow,
  courseTitle = ""
): CourseRegistrationStudentView {
  const participantName = normalizeRegistrationName(row);
  const participantEmail = normalizeRegistrationEmail(row);

  return {
    id: row.id,
    fullName: row.full_name?.trim() || participantName,
    birthday: "",
    phone: row.phone || "",
    learnerGroup: Number(row.learner_group ?? 0),
    email: row.email || participantEmail,
    referralCode: "",
    expectations: row.note || "",
    courseId: row.course_id || "",
    courseName: courseTitle || row.course_id || "",
    registeredAt: row.created_at || row.updated_at || "",
    facebook: row.facebook || "",
    userId: row.user_id || "",
    status: row.status || "new",
  };
}

export function buildRegistrationInsert(params: {
  courseId: string;
  userId: string;
  participantName: string;
  participantEmail: string;
  phone: string;
  learnerGroup: number;
  facebook?: string;
  learningNeeds: string;
}): CourseRegistrationInsert {
  const now = new Date().toISOString();

  return {
    course_id: params.courseId,
    user_id: params.userId,
    full_name: params.participantName,
    email: params.participantEmail,
    phone: params.phone,
    facebook: params.facebook || "",
    note: params.learningNeeds,
    learner_group: params.learnerGroup,
    status: "new",
    created_at: now,
    updated_at: now,
    source: "course_registration",
  };
}

export function buildConfirmationEmail(payload: RegistrationEmailPayload) {
  const baseUrl = getPublicSiteUrl();
  const courseUrl = new URL(`/courses/${payload.courseSlug}`, baseUrl).toString();
  const isPaidCourse = Number(payload.coursePrice) > 0;
  const isHiddenPriceCourse = Boolean(payload.courseHidePrice) && isPaidCourse;
  const safeName = escapeHtml(payload.participantName);
  const safeCourse = escapeHtml(payload.courseTitle);
  const safeCourseLink = escapeHtml(courseUrl);
  const safePhone = escapeHtml(payload.phone);
  const safeLearnerGroup = escapeHtml(
    payload.learnerGroup === 1
      ? "Học sinh / Sinh viên"
      : payload.learnerGroup === 2
        ? "Người đi làm 0-2 năm"
        : payload.learnerGroup === 3
          ? "Người đi làm 3-5 năm"
          : "Người chuyển ngành / Khác"
  );
  const safeEmail = escapeHtml(payload.participantEmail);
  const safeNeeds = escapeHtml(payload.learningNeeds || "Không có");
  const safeFacebook = escapeHtml(payload.facebook || "Không cung cấp");
  const safeRegisteredAt = escapeHtml(
    new Date(payload.registeredAt).toLocaleString("vi-VN", {
      dateStyle: "long",
      timeStyle: "short",
    })
  );

  if (isHiddenPriceCourse) {
    const subject = `Xác nhận thông tin đăng ký khóa học ${payload.courseTitle}`;
    const text = [
      `Chào ${payload.participantName},`,
      "",
      `DUA Edu đã nhận được thông tin bạn quan tâm đến khóa học ${payload.courseTitle} rồi nha.`,
      "",
      "Với khóa học này, DUA Edu sẽ tư vấn trực tiếp về học phí, hình thức học và các bước đăng ký tiếp theo để phù hợp hơn với nhu cầu của bạn.",
      "",
      "Bạn vui lòng liên hệ fanpage DUA Edu để được hỗ trợ hoàn tất đăng ký:",
      "",
      "Fanpage DUA Edu:",
      "https://www.facebook.com/duadata",
      "",
      "Sau khi thông tin được xác nhận, DUA Edu sẽ gửi bạn hướng dẫn tham gia khóa học trong thời gian sớm nhất.",
      "",
      "Cảm ơn bạn đã quan tâm đến DUA Edu.",
      "",
      "DUA Edu",
    ].join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;background:#f8fafc;padding:24px">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:24px;padding:32px">
          <p style="margin:0 0 12px;font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:#059669;font-weight:700">DUA Edu</p>
          <h2 style="margin:0 0 16px;font-size:26px;color:#0f172a;line-height:1.25">Xác nhận thông tin đăng ký khóa học</h2>
          <p style="margin:0 0 14px">Chào <strong>${safeName}</strong>,</p>
          <p style="margin:0 0 14px">DUA Edu đã nhận được thông tin bạn quan tâm đến khóa học <strong>${safeCourse}</strong> rồi nha.</p>
          <p style="margin:0 0 14px">Với khóa học này, DUA Edu sẽ tư vấn trực tiếp về học phí, hình thức học và các bước đăng ký tiếp theo để phù hợp hơn với nhu cầu của bạn.</p>
          <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:20px;padding:18px;margin:24px 0">
            <p style="margin:0 0 10px;color:#475569">Bạn vui lòng liên hệ fanpage DUA Edu để được hỗ trợ hoàn tất đăng ký:</p>
            <p style="margin:0;font-weight:700;color:#0f172a">Fanpage DUA Edu:</p>
            <p style="margin:6px 0 0"><a href="https://www.facebook.com/duadata" style="color:#059669;text-decoration:none">https://www.facebook.com/duadata</a></p>
          </div>
          <p style="margin:0 0 14px">Sau khi thông tin được xác nhận, DUA Edu sẽ gửi bạn hướng dẫn tham gia khóa học trong thời gian sớm nhất.</p>
          <p style="margin:0 0 14px;color:#475569">Cảm ơn bạn đã quan tâm đến DUA Edu.</p>
          <p style="margin:24px 0 0;color:#0f172a">DUA Edu</p>
        </div>
      </div>
    `;

    return { subject, text, html };
  }

  if (isPaidCourse) {
    const paymentAmount = formatCurrencyVn(Number(payload.coursePrice) || 0);
    const paymentNote = buildPaymentNote(payload);
    const qrCode =
      process.env.NEXT_PUBLIC_PAYMENT_QR_CODE_URL ||
      process.env.PAYMENT_QR_CODE_URL ||
      "https://i.ibb.co/WWpB9mvS/Screenshot-2026-05-09-at-08-36-45.png";
    const safePaymentAmount = escapeHtml(paymentAmount);
    const safePaymentNote = escapeHtml(paymentNote);
    const safeQrCode = escapeHtml(qrCode);
    const subject = `Xác nhận thông tin thanh toán khóa học ${payload.courseTitle}`;

    const text = [
      `Chào ${payload.participantName},`,
      "",
      `DUA Edu đã nhận được thông tin bạn quan tâm đến khóa học ${payload.courseTitle} rồi nha.`,
      "",
      "Để DUA Edu có thể giữ chỗ và hoàn tất đăng ký cho bạn, bạn vui lòng chuyển khoản học phí/đặt cọc theo thông tin bên dưới:",
      "",
      `Số tiền cần thanh toán: ${paymentAmount}`,
      `Thông tin chuyển khoản:`,
      `STK: 1014645434`,
      `Ngân hàng: Vietcombank`,
      `Chủ tài khoản: Pham Thi Thom`,
      "",
      `Nội dung chuyển khoản: ${paymentNote}`,
      `Mã QR thanh toán: ${qrCode || "Vui lòng liên hệ fanpage DUA Edu để nhận mã QR thanh toán."}`,
      "",
      "Sau khi chuyển khoản xong, bạn chụp lại hóa đơn/giao dịch và inbox cho fanpage DUA Edu (https://www.facebook.com/duadata) để team kiểm tra và xác nhận đăng ký giúp bạn nhé.",
      "",
      "Lưu ý nhỏ: Ở bước này, đăng ký sẽ được hoàn tất sau khi DUA Edu nhận được minh chứng chuyển khoản và đối soát thanh toán thành công.",
      "",
      "Nếu bạn cần DUA Edu hỗ trợ thêm về lịch học, lộ trình hoặc hình thức tham gia, cứ nhắn lại cho DUA Edu nha.",
      "",
      "Cảm ơn bạn đã tin tưởng và quan tâm đến DUA Edu.",
      "",
      "DUA Edu",
    ].join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;background:#f8fafc;padding:24px">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:24px;padding:32px">
          <p style="margin:0 0 12px;font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:#059669;font-weight:700">DUA Edu</p>
          <h2 style="margin:0 0 16px;font-size:26px;color:#0f172a;line-height:1.25">Xác nhận thông tin thanh toán khóa học</h2>
          <p style="margin:0 0 14px">Chào <strong>${safeName}</strong>,</p>
          <p style="margin:0 0 14px">DUA Edu đã nhận được thông tin bạn quan tâm đến khóa học <strong>${safeCourse}</strong> rồi nha.</p>
          <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:20px;padding:20px;margin:24px 0">
            <p style="margin:0 0 10px;color:#475569">Để DUA Edu có thể giữ chỗ và hoàn tất đăng ký cho bạn, bạn vui lòng chuyển khoản học phí/đặt cọc theo thông tin bên dưới:</p>
            <table style="width:100%;border-collapse:collapse">
              <tbody>
                <tr><td style="padding:8px 0;color:#64748b;width:180px">Số tiền cần thanh toán</td><td style="padding:8px 0;font-weight:700;color:#0f172a">${safePaymentAmount}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b">Thông tin chuyển khoản</td><td style="padding:8px 0;font-weight:700;color:#0f172a">STK: 1014645434</td></tr>
                <tr><td style="padding:8px 0;color:#64748b"></td><td style="padding:0 0 8px;font-weight:700;color:#0f172a">Vietcombank</td></tr>
                <tr><td style="padding:8px 0;color:#64748b"></td><td style="padding:0 0 8px;font-weight:700;color:#0f172a">Pham Thi Thom</td></tr>
                <tr><td style="padding:8px 0;color:#64748b">Nội dung chuyển khoản</td><td style="padding:8px 0;font-weight:700;color:#0f172a">${safePaymentNote}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;vertical-align:top">Mã QR thanh toán</td><td style="padding:8px 0;color:#0f172a">${safeQrCode ? `<a href="${safeQrCode}" style="color:#059669;text-decoration:none"><img src="${safeQrCode}" alt="QR thanh toán" style="max-width:240px;width:100%;height:auto;border-radius:16px;border:1px solid #e5e7eb;display:block" /></a>` : "Vui lòng liên hệ fanpage DUA Edu để nhận mã QR thanh toán."}</td></tr>
              </tbody>
            </table>
          </div>
          <p style="margin:0 0 14px">Sau khi chuyển khoản xong, bạn chụp lại hóa đơn/giao dịch và inbox cho fanpage DUA Edu (<a href="https://www.facebook.com/duadata" style="color:#059669;text-decoration:none">https://www.facebook.com/duadata</a>) để team kiểm tra và xác nhận đăng ký giúp bạn nhé.</p>
          <p style="margin:0 0 14px;color:#475569">Lưu ý nhỏ: Ở bước này, đăng ký sẽ được hoàn tất sau khi DUA Edu nhận được minh chứng chuyển khoản và đối soát thanh toán thành công.</p>
          <p style="margin:0 0 14px;color:#475569">Nếu bạn cần DUA Edu hỗ trợ thêm về lịch học, lộ trình hoặc hình thức tham gia, cứ nhắn lại cho DUA Edu nha.</p>
          <p style="margin:24px 0 0;color:#0f172a">Cảm ơn bạn đã tin tưởng và quan tâm đến DUA Edu.</p>
          <p style="margin:8px 0 0;color:#0f172a;font-weight:700">DUA Edu</p>
        </div>
      </div>
    `;

    return { subject, text, html };
  }

  const subject = `Xác nhận đăng ký khóa học ${payload.courseTitle}`;

  const text = [
    `Xin chào ${payload.participantName},`,
    "",
    `DUA Edu đã nhận được đăng ký của bạn cho khóa học: ${payload.courseTitle}.`,
    `Link khóa học: ${courseUrl}`,
    `Email đăng nhập: ${payload.participantEmail}`,
    `Số điện thoại: ${payload.phone}`,
    `Nhóm người học: ${payload.learnerGroup}`,
    `Facebook: ${payload.facebook || "Không cung cấp"}`,
    `Nhu cầu học: ${payload.learningNeeds || "Không có"}`,
    `Thời gian đăng ký: ${new Date(payload.registeredAt).toLocaleString("vi-VN")}`,
    "",
    "Đội ngũ DUA Edu sẽ sớm liên hệ với bạn qua Zalo/Facebook để xác nhận.",
    "",
    "Trân trọng,",
    "DUA Edu",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;background:#f8fafc;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;padding:32px">
        <h2 style="margin:0 0 16px;font-size:24px;color:#047857">Xác nhận đăng ký khóa học</h2>
        <p style="margin:0 0 12px">Xin chào <strong>${safeName}</strong>,</p>
        <p style="margin:0 0 20px">DUA Edu đã nhận được đăng ký của bạn cho khóa học <strong>${safeCourse}</strong>.</p>
        <table style="width:100%;border-collapse:collapse">
          <tbody>
            <tr><td style="padding:8px 0;color:#6b7280;width:180px">Link khóa học</td><td style="padding:8px 0"><a href="${safeCourseLink}" style="color:#059669;text-decoration:none">${safeCourseLink}</a></td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;width:180px">Email đăng nhập</td><td style="padding:8px 0">${safeEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Số điện thoại</td><td style="padding:8px 0">${safePhone}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Nhóm người học</td><td style="padding:8px 0">${safeLearnerGroup}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Facebook</td><td style="padding:8px 0">${safeFacebook}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Nhu cầu học</td><td style="padding:8px 0">${safeNeeds}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Thời gian đăng ký</td><td style="padding:8px 0">${safeRegisteredAt}</td></tr>
          </tbody>
        </table>
        <p style="margin:20px 0 0;color:#374151">Đội ngũ DUA Edu sẽ sớm liên hệ với bạn qua Zalo/Facebook để xác nhận.</p>
        <p style="margin:8px 0 0;color:#374151">Nếu cần hỗ trợ thêm, bạn có thể phản hồi email này.</p>
      </div>
    </div>
  `;

  return { subject, text, html };
}
