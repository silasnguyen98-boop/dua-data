"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import type { NewsletterContent, NewsletterRecipient, NewsletterSchedule } from "@/types/newsletter";

function safeGetSessionItem(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function decodeStoredRole(stored: string | null): string | null {
  if (!stored) return null;
  const raw = stored.trim();
  if (!raw) return null;
  try {
    const decoded = atob(raw).trim();
    return decoded.includes(":") ? (decoded.split(":")[1] || decoded.split(":")[0] || decoded).trim() : decoded;
  } catch {
    return raw.includes(":") ? (raw.split(":")[1] || raw.split(":")[0] || raw).trim() : raw;
  }
}

function buildAuthHeader(): Record<string, string> {
  const stored = safeGetSessionItem("admin_role");
  if (!stored) return {};
  const role = decodeStoredRole(stored) || stored.trim();
  if (!role) return {};
  return { Authorization: `Bearer ${btoa(role)}` };
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function renderItemCount(items: NewsletterContent["resources"]) {
  return items.length > 0 ? `${items.length} mục` : "0 mục";
}

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Chủ nhật" },
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
];

export default function NewlettersPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState<NewsletterRecipient[]>([]);
  const [content, setContent] = useState<NewsletterContent>({ resources: [], jobs: [], courses: [] });
  const [schedule, setSchedule] = useState<NewsletterSchedule>({
    enabled: true,
    dayOfWeek: 6,
    hour: 7,
    minute: 0,
    timezone: "Asia/Ho_Chi_Minh",
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [wantsIds, setWantsIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/newletters", {
        cache: "no-store",
        headers: buildAuthHeader(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Không thể tải dữ liệu newletters");

      const recipientsData = Array.isArray(data.recipients) ? (data.recipients as NewsletterRecipient[]) : [];
      setRecipients(recipientsData);
      setContent(data.content || { resources: [], jobs: [], courses: [] });
      setSchedule(
        data.schedule
          ? {
              enabled: Boolean(data.schedule.enabled),
              dayOfWeek: Number(data.schedule.dayOfWeek ?? 6),
              hour: Number(data.schedule.hour ?? 7),
              minute: Number(data.schedule.minute ?? 0),
              timezone: String(data.schedule.timezone || "Asia/Ho_Chi_Minh"),
            }
          : {
              enabled: true,
              dayOfWeek: 6,
              hour: 7,
              minute: 0,
              timezone: "Asia/Ho_Chi_Minh",
            },
      );

      const nextSelected = new Set<string>();
      const nextWants = new Set<string>();
      recipientsData.forEach((recipient) => {
        if (recipient.selected) nextSelected.add(recipient.userId);
        if (recipient.wantsResources) nextWants.add(recipient.userId);
      });
      setSelectedIds(nextSelected);
      setWantsIds(nextWants);
    } catch (err) {
      setRecipients([]);
      setMessage(err instanceof Error ? err.message : "Không thể tải dữ liệu newletters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isAuth = safeGetSessionItem("admin_auth");
    if (!isAuth) {
      window.location.href = "/admin/login";
      return;
    }

    const role = decodeStoredRole(safeGetSessionItem("admin_role"));
    if (role !== "system_admin" && role !== "content_manager") {
      window.location.href = "/admin";
      return;
    }

    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    fetchData();
  }, [authChecked, fetchData]);

  const stats = useMemo(() => {
    const selected = recipients.filter((recipient) => recipient.selected && recipient.wantsResources).length;
    const total = recipients.length;
    return { total, selected };
  }, [recipients]);

  const updateRecipient = async (recipient: NewsletterRecipient, next: Partial<NewsletterRecipient>) => {
    const merged = {
      ...recipient,
      ...next,
    };

    const nextSelected = new Set(selectedIds);
    if (merged.selected) nextSelected.add(merged.userId);
    else nextSelected.delete(merged.userId);
    setSelectedIds(nextSelected);

    const nextWants = new Set(wantsIds);
    if (merged.wantsResources) nextWants.add(merged.userId);
    else nextWants.delete(merged.userId);
    setWantsIds(nextWants);

    const res = await fetch("/api/newletters", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeader(),
      },
      body: JSON.stringify({
        userId: recipient.userId,
        email: merged.email,
        fullName: merged.fullName,
        selected: merged.selected,
        wantsResources: merged.wantsResources,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || "Không thể cập nhật người nhận");
    }

    setRecipients((current) =>
      current.map((item) =>
        item.userId === recipient.userId ? { ...item, ...merged, lastSentAt: data.last_sent_at || item.lastSentAt } : item,
      ),
    );
  };

  const handleSendNow = async () => {
    setSending(true);
    setMessage("");
    try {
      const res = await fetch("/api/newletters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader(),
        },
        body: JSON.stringify({
          recipientIds: recipients.filter((recipient) => recipient.selected && recipient.wantsResources).map((recipient) => recipient.userId),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Gửi newsletter thất bại");
      setMessage(`Đã gửi ${data.sent?.length || 0}/${data.total || 0} email.`);
      await fetchData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gửi newsletter thất bại");
    } finally {
      setSending(false);
    }
  };

  const saveSchedule = async () => {
    setSavingSchedule(true);
    setMessage("");
    try {
      const res = await fetch("/api/newletters", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader(),
        },
        body: JSON.stringify({ schedule }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Không thể lưu lịch gửi");
      setMessage("Đã lưu lịch gửi bản tin.");
      await fetchData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Không thể lưu lịch gửi");
    } finally {
      setSavingSchedule(false);
    }
  };

  const toggleSelected = (recipient: NewsletterRecipient, checked: boolean) => {
    void updateRecipient(recipient, { selected: checked });
  };

  const toggleWants = (recipient: NewsletterRecipient, checked: boolean) => {
    void updateRecipient(recipient, { wantsResources: checked });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_30%),linear-gradient(to_bottom,#fbfdff,#f7faf8)] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo href="/newletters" showText={false} imageClassName="h-9 w-9" />
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-green-700">Newletters</div>
              <h1 className="truncate text-lg font-bold text-gray-950 sm:text-xl">
                Quản lý bản tin gửi cho người học
              </h1>
              <p className="truncate text-xs text-gray-500 sm:text-sm">
                Gửi mỗi thứ 7 lúc 7:00 sáng cho các tài khoản đã chọn và muốn nhận tài liệu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="hidden rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:inline-flex"
            >
              Về Admin
            </Link>
            <button
              onClick={handleSendNow}
              disabled={sending || stats.selected === 0}
              className="inline-flex items-center rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Đang gửi..." : "Gửi ngay"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {message && (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tổng account</p>
            <p className="mt-2 text-3xl font-black text-gray-950">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Đã chọn</p>
            <p className="mt-2 text-3xl font-black text-green-700">{stats.selected}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tài nguyên</p>
            <p className="mt-2 text-3xl font-black text-gray-950">{renderItemCount(content.resources)}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Việc làm / Khóa học</p>
            <p className="mt-2 text-2xl font-black text-gray-950">
              {content.jobs.length} / {content.courses.length}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-950">Tài khoản nhận bản tin</h2>
                <p className="text-sm text-gray-500">Chỉ những account được chọn và muốn nhận tài liệu mới được gửi.</p>
              </div>
              <button
                onClick={fetchData}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Làm mới
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-500">Đang tải dữ liệu...</div>
            ) : recipients.length === 0 ? (
              <div className="py-20 text-center text-gray-500">
                Chưa có tài khoản nào từ hệ thống đăng nhập.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[920px] w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Chọn</th>
                      <th className="px-4 py-3 text-left font-semibold">Muốn nhận</th>
                      <th className="px-4 py-3 text-left font-semibold">Học viên</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Gửi lần cuối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recipients.map((recipient) => (
                      <tr key={recipient.userId} className="hover:bg-gray-50/70">
                        <td className="px-4 py-4">
                          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(recipient.userId)}
                              onChange={(e) => toggleSelected(recipient, e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            Chọn
                          </label>
                        </td>
                        <td className="px-4 py-4">
                          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={wantsIds.has(recipient.userId)}
                              onChange={(e) => toggleWants(recipient, e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            Tài liệu
                          </label>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-950">{recipient.fullName || "Ẩn danh"}</div>
                          <div className="mt-1 text-xs text-gray-500">User ID: {recipient.userId}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">{recipient.email}</div>
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          <div>{formatDateTime(recipient.lastSentAt)}</div>
                          <div className="mt-1 text-xs text-gray-500">{recipient.lastSentBatchKey || "Chưa gửi"}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-950">Lịch gửi tự động</h2>
              <p className="mt-1 text-sm text-gray-500">
                Bạn có thể đổi ngày và giờ gửi thay vì cố định thứ 7 lúc 7:00 sáng.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={(e) => setSchedule((prev) => ({ ...prev, enabled: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  Bật lịch gửi tự động
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Ngày gửi</label>
                    <select
                      value={schedule.dayOfWeek}
                      onChange={(e) => setSchedule((prev) => ({ ...prev, dayOfWeek: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    >
                      {WEEKDAY_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Giờ gửi</label>
                    <input
                      type="time"
                      value={`${String(schedule.hour).padStart(2, "0")}:${String(schedule.minute).padStart(2, "0")}`}
                      onChange={(e) => {
                        const [hour, minute] = e.target.value.split(":");
                        setSchedule((prev) => ({
                          ...prev,
                          hour: Number(hour || 0),
                          minute: Number(minute || 0),
                        }));
                      }}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                  Lịch hiện tại: {WEEKDAY_OPTIONS.find((item) => item.value === schedule.dayOfWeek)?.label || "Không rõ"}{" "}
                  lúc {String(schedule.hour).padStart(2, "0")}:{String(schedule.minute).padStart(2, "0")} theo{" "}
                  {schedule.timezone}
                </div>

                <button
                  type="button"
                  onClick={saveSchedule}
                  disabled={savingSchedule}
                  className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingSchedule ? "Đang lưu..." : "Lưu lịch"}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-950">Bản tin mẫu</h2>
              <p className="mt-1 text-sm text-gray-500">Mỗi mail sẽ gồm 3 phần: tài nguyên, việc làm và khóa học mới.</p>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-green-100 bg-green-50/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-green-700">Tài nguyên mới</div>
                  <div className="mt-2 space-y-2">
                    {content.resources.length === 0 ? (
                      <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
                    ) : (
                      content.resources.slice(0, 3).map((item) => (
                        <div key={item.id} className="text-sm">
                          <a href={item.url} className="font-medium text-gray-950 hover:text-green-700">
                            {item.title}
                          </a>
                          <p className="text-gray-600">{item.excerpt}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">Việc làm mới</div>
                  <div className="mt-2 space-y-2">
                    {content.jobs.length === 0 ? (
                      <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
                    ) : (
                      content.jobs.slice(0, 3).map((item) => (
                        <div key={item.id} className="text-sm">
                          <a href={item.url} className="font-medium text-gray-950 hover:text-blue-700">
                            {item.title}
                          </a>
                          <p className="text-gray-600">{item.excerpt}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Khóa học mới</div>
                  <div className="mt-2 space-y-2">
                    {content.courses.length === 0 ? (
                      <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
                    ) : (
                      content.courses.slice(0, 3).map((item) => (
                        <div key={item.id} className="text-sm">
                          <a href={item.url} className="font-medium text-gray-950 hover:text-amber-700">
                            {item.title}
                          </a>
                          <p className="text-gray-600">{item.excerpt}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-stone-950 p-5 text-white shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Lịch gửi tự động</p>
              <h3 className="mt-2 text-2xl font-semibold">7:00 sáng thứ 7 hằng tuần</h3>
              <p className="mt-3 text-sm leading-7 text-white/70">
                Route cron đã sẵn sàng ở <span className="font-semibold text-white">/api/newletters/cron</span>.
                Bạn chỉ cần cấu hình cron job trên VPS hoặc dịch vụ scheduler để gọi route này mỗi thứ 7 lúc 7 giờ sáng.
              </p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                Secret key: <span className="font-semibold text-white">NEWSLETTER_CRON_SECRET</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
