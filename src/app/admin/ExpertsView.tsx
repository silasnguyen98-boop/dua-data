"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type Expert } from "@/lib/expert-data";

type ExpertForm = Omit<Expert, "id" | "createdAt" | "updatedAt">;

const emptyForm: ExpertForm = {
  name: "",
  position: "",
  previousWork: "",
  avatarUrl: "",
  linkedin: "",
  order: 0,
  published: true,
  group: "home",
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function groupLabel(group?: string) {
  return group === "genzlamdata" ? "GenZ làm Data" : "Trang chủ";
}

export default function ExpertsView() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expert | null>(null);
  const [form, setForm] = useState<ExpertForm>(emptyForm);
  const [filter, setFilter] = useState<"all" | "home" | "genzlamdata">("all");
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("");

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/experts", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      setExperts(Array.isArray(data) ? data : []);
    } catch {
      setExperts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  const filteredExperts = useMemo(() => {
    return experts
      .filter((expert) => filter === "all" || (expert.group || "home") === filter)
      .slice()
      .sort((a, b) => {
        const groupCompare = (a.group || "home").localeCompare(b.group || "home");
        if (groupCompare !== 0) return groupCompare;
        return (a.order || 0) - (b.order || 0);
      });
  }, [experts, filter]);

  const counts = useMemo(() => {
    return {
      all: experts.length,
      home: experts.filter((expert) => (expert.group || "home") === "home").length,
      genzlamdata: experts.filter((expert) => expert.group === "genzlamdata").length,
      published: experts.filter((expert) => expert.published !== false).length,
    };
  }, [experts]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(expert: Expert) {
    setEditing(expert);
    setForm({
      name: expert.name || "",
      position: expert.position || "",
      previousWork: expert.previousWork || "",
      avatarUrl: expert.avatarUrl || "",
      linkedin: expert.linkedin || "",
      order: expert.order || 0,
      published: expert.published !== false,
      group: expert.group || "home",
    });
    setShowForm(true);
  }

  async function saveExpert() {
    if (!form.name?.trim() || !form.position?.trim()) {
      alert("Vui lòng nhập tên và vị trí.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/experts", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editing ? { id: editing.id } : {}),
          name: form.name.trim(),
          position: form.position.trim(),
          previousWork: form.previousWork?.trim() || "",
          avatarUrl: form.avatarUrl?.trim() || "",
          linkedin: form.linkedin?.trim() || "",
          order: Number(form.order) || 0,
          published: form.published !== false,
          group: form.group || "home",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
        alert(`Lưu chuyên gia thất bại: ${err.error || "Lỗi không xác định"}`);
        return;
      }

      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      fetchExperts();
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpert(id: string) {
    if (!confirm("Bạn có chắc muốn xóa chuyên gia này?")) return;
    const res = await fetch(`/api/experts?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      alert(`Xóa thất bại: ${err.error || "Lỗi không xác định"}`);
      return;
    }
    fetchExperts();
  }

  async function togglePublished(expert: Expert) {
    const res = await fetch("/api/experts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: expert.id,
        name: expert.name,
        position: expert.position,
        previousWork: expert.previousWork || "",
        avatarUrl: expert.avatarUrl || "",
        linkedin: expert.linkedin || "",
        order: expert.order || 0,
        published: expert.published === false,
        group: expert.group || "home",
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      alert(`Cập nhật thất bại: ${err.error || "Lỗi không xác định"}`);
      return;
    }
    fetchExperts();
  }

  async function syncExpertsJson() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/experts/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`Đồng bộ thất bại: ${data.error || "Lỗi không xác định"}`);
        return;
      }
      setLastSyncedAt(data.timestamp || new Date().toISOString());
      alert(`Đã đồng bộ ${data.count || 0} bản ghi ra src/data/experts.json`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-green-600">Experts</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Quản lý chuyên gia & đội ngũ</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            CRUD dữ liệu hiển thị trong slide expert trang chủ và đội ngũ phát triển của GenZ làm Data.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={syncExpertsJson}
            disabled={syncing}
            className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-700 shadow-sm transition hover:bg-green-50 disabled:opacity-60"
          >
            {syncing ? "Đang đồng bộ..." : "Đồng bộ JSON"}
          </button>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-green-200 transition hover:bg-green-700"
          >
            + Thêm chuyên gia
          </button>
        </div>
      </div>

      {lastSyncedAt ? (
        <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          Đã đồng bộ JSON lúc {new Date(lastSyncedAt).toLocaleString("vi-VN")}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Tổng", counts.all],
          ["Trang chủ", counts.home],
          ["GenZ làm Data", counts.genzlamdata],
          ["Đang hiển thị", counts.published],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: "Tất cả" },
          { id: "home", label: "Trang chủ" },
          { id: "genzlamdata", label: "GenZ làm Data" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id as typeof filter)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              filter === item.id
                ? "bg-green-600 text-white shadow-lg shadow-green-100"
                : "border border-slate-200 bg-white text-slate-500 hover:text-green-700"
            }`}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={fetchExperts}
          className="ml-auto rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center text-slate-500">Đang tải...</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredExperts.map((expert) => (
            <div key={expert.id} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                {expert.avatarUrl ? (
                  <img src={expert.avatarUrl} alt={expert.name} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-green-100" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-2xl font-black text-white">
                    {expert.name.charAt(0) || "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-lg font-black text-slate-950">{expert.name}</h3>
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-black text-green-700">
                      {groupLabel(expert.group)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-green-700">{expert.position}</p>
                  {expert.previousWork ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{expert.previousWork}</p> : null}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Thứ tự</p>
                  <p className="font-black text-slate-900">{expert.order || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Trạng thái</p>
                  <p className={`font-black ${expert.published !== false ? "text-green-700" : "text-slate-400"}`}>
                    {expert.published !== false ? "Hiện" : "Ẩn"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Cập nhật</p>
                  <p className="font-black text-slate-900">{formatDate(expert.updatedAt || expert.createdAt)}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => openEdit(expert)} className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">
                  Sửa
                </button>
                <button type="button" onClick={() => togglePublished(expert)} className="rounded-xl bg-green-50 px-3 py-2 text-xs font-black text-green-700 hover:bg-green-100">
                  {expert.published !== false ? "Ẩn" : "Hiện"}
                </button>
                <button type="button" onClick={() => deleteExpert(expert.id)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100">
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/60 px-4 py-10 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-3xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-950">{editing ? "Sửa chuyên gia" : "Thêm chuyên gia"}</h3>
                <p className="mt-1 text-sm text-slate-500">Dữ liệu được lưu trực tiếp trong bảng experts của PostgreSQL.</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-500">
                Đóng
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Tên *</span>
                <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Vị trí *</span>
                <input value={form.position || ""} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Mô tả</span>
                <input value={form.previousWork || ""} onChange={(e) => setForm({ ...form, previousWork: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Avatar URL</span>
                <input value={form.avatarUrl || ""} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">LinkedIn URL</span>
                <input value={form.linkedin || ""} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Thứ tự</span>
                <input type="number" value={form.order || 0} onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Nhóm hiển thị</span>
                <select value={form.group || "home"} onChange={(e) => setForm({ ...form, group: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white">
                  <option value="home">Trang chủ</option>
                  <option value="genzlamdata">GenZ làm Data</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => setForm({ ...form, published: !form.published })}
                className={`rounded-2xl border px-4 py-3 text-sm font-black transition md:col-span-2 ${
                  form.published ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                {form.published ? "Đang hiển thị" : "Đang ẩn"}
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                Hủy
              </button>
              <button type="button" disabled={saving} onClick={saveExpert} className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-green-100 hover:bg-green-700 disabled:opacity-60">
                {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
