"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Course, CurriculumItem } from "@/types/course";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

interface Student {
  id: string;
  fullName: string;
  facebook: string;
  birthday: string;
  phone: string;
  email: string;
  referralCode: string;
  expectations: string;
  courseId: string;
  courseName: string;
  registeredAt: string;
}

const emptyCourse: Omit<Course, "id"> = {
  slug: "",
  title: "",
  shortDescription: "",
  description: "",
  image: "",
  imageUrl: "",
  instructor: "Đội Ngũ Dứa Data",
  price: 0,
  originalPrice: 0,
  discount: 0,
  totalLessons: 0,
  students: 0,
  rating: 0,
  reviews: 0,
  startDate: "",
  endDate: "",
  schedule: "",
  hours: "",
  category: "",
  curriculum: [],
  outcomes: [],
  targetAudience: [],
  published: false,
  comingSoon: false,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

interface Resource {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  imageUrl: string;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyResource: Omit<Resource, "id" | "createdAt" | "updatedAt"> = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  category: "Article",
  imageUrl: "",
  author: "Dứa Data",
  published: true,
};

interface Activity {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  community: "student" | "genz";
  registrationLink: string;
  registrationDeadline: string;
  eventDate: string;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyActivity: Omit<Activity, "id" | "createdAt" | "updatedAt"> = {
  title: "",
  summary: "",
  content: "",
  imageUrl: "",
  community: "student",
  registrationLink: "",
  registrationDeadline: "",
  eventDate: "",
  author: "Dứa Data",
  published: true,
};

interface Job {
  id: string;
  title: string;
  company: string;
  summary: string;
  content: string;
  imageUrl: string;
  workType: string;
  location: string;
  position: string;
  applicationLink: string;
  applicationDeadline: string;
  salary: string;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyJob: Omit<Job, "id" | "createdAt" | "updatedAt"> = {
  title: "",
  company: "",
  summary: "",
  content: "",
  imageUrl: "",
  workType: "Full-time",
  location: "",
  position: "",
  applicationLink: "",
  applicationDeadline: "",
  salary: "",
  author: "Dứa Data",
  published: true,
};

interface Expert {
  id: string;
  name: string;
  position: string;
  previousWork: string;
  avatarUrl: string;
  linkedin: string;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyExpert: Omit<Expert, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  position: "",
  previousWork: "",
  avatarUrl: "",
  linkedin: "",
  order: 0,
  published: true,
};

interface Shortlink {
  id: string;
  url: string;
  title: string;
  code: string;
  clicks: number;
  createdAt: string;
}

interface LeadResource {
  id: string;
  fullName: string;
  email: string;
  role: string;
  resourceType: string;
  createdAt: string;
}

type ActiveView = "dashboard" | "courses" | "students" | "resources" | "activities" | "jobs" | "experts" | "shortlinks" | "leads" | "users" | "waitlist";
type UserRole = "system_admin" | "content_manager" | "sales_executive" | "teaching_assistant";

interface WaitListEntry {
  id: string;
  courseId: string;
  courseTitle: string;
  name: string;
  phone: string;
  email?: string;
  registeredAt: string;
  status: "pending" | "contacted" | "converted";
}
type DateFilter = "all" | "today" | "week" | "month" | "year" | "custom";

const ROLE_LABELS: Record<UserRole, string> = {
  system_admin: "Quản trị hệ thống",
  content_manager: "Quản lý nội dung",
  sales_executive: "Kinh doanh",
  teaching_assistant: "Trợ giảng",
};

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = sessionStorage.getItem("admin_auth");
      if (!isAuth) {
        router.replace("/admin/login");
      } else {
        setAuthChecked(true);
      }
    }
  }, [router]);

  // Course state
  const [courses, setCourses] = useState<Course[]>([]);

  // Wait-list state
  const [waitList, setWaitList] = useState<WaitListEntry[]>([]);
  const [waitListLoading, setWaitListLoading] = useState(false);
  const [waitListFilter, setWaitListFilter] = useState("all");
  const [waitListCourseFilter, setWaitListCourseFilter] = useState("all");
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<Omit<Course, "id">>(emptyCourse);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Curriculum form state
  const [currPhase, setCurrPhase] = useState("");
  const [currTitle, setCurrTitle] = useState("");
  const [currLessons, setCurrLessons] = useState(0);
  const [currTopics, setCurrTopics] = useState("");
  const [editingTopicsIndex, setEditingTopicsIndex] = useState<number | null>(null);
  const [editingTopicsValue, setEditingTopicsValue] = useState("");
  const [editingCurriculumIndex, setEditingCurriculumIndex] = useState<number | null>(null);
  const [editCurriculumPhase, setEditCurriculumPhase] = useState("");
  const [editCurriculumTitle, setEditCurriculumTitle] = useState("");
  const [editCurriculumLessons, setEditCurriculumLessons] = useState(0);

  // Outcomes / target audience
  const [newOutcome, setNewOutcome] = useState("");
  const [newTarget, setNewTarget] = useState("");

  // Student state
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Student expanded & processed state
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [processedStudents, setProcessedStudents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("processed_students");
      if (saved) setProcessedStudents(JSON.parse(saved));
    }
  }, []);

  const toggleProcessed = (id: string) => {
    setProcessedStudents(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("processed_students", JSON.stringify(next));
      return next;
    });
  };

  // Resource state
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceForm, setResourceForm] = useState<Omit<Resource, "id" | "createdAt" | "updatedAt">>(emptyResource);
  const [showResourceForm, setShowResourceForm] = useState(false);

  // Activity state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityForm, setActivityForm] = useState<Omit<Activity, "id" | "createdAt" | "updatedAt">>(emptyActivity);
  const [showActivityForm, setShowActivityForm] = useState(false);

  // Job state
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobForm, setJobForm] = useState<Omit<Job, "id" | "createdAt" | "updatedAt">>(emptyJob);
  const [showJobForm, setShowJobForm] = useState(false);

  // Expert state
  const [expertsList, setExpertsList] = useState<Expert[]>([]);
  const [expertsLoading, setExpertsLoading] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [expertForm, setExpertForm] = useState<Omit<Expert, "id" | "createdAt" | "updatedAt">>(emptyExpert);
  const [showExpertForm, setShowExpertForm] = useState(false);

  // Shortlink state
  const [shortlinks, setShortlinks] = useState<Shortlink[]>([]);
  const [shortlinksLoading, setShortlinksLoading] = useState(false);

  // Lead resource state
  const [leads, setLeads] = useState<LeadResource[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // User management state
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({ username: "", password: "", role: "sales_executive" as UserRole, name: "" });
  const [showUserForm, setShowUserForm] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // Build auth header from session
  function buildAuthHeader(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const role = sessionStorage.getItem("admin_role");
    if (!role) return {};
    return { Authorization: `Bearer ${role}` };
  }

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchResources = useCallback(async () => {
    setResourcesLoading(true);
    const res = await fetch("/api/resources");
    const data = await res.json();
    setResources(data);
    setResourcesLoading(false);
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/courses");
    const data = await res.json();
    setCourses(data);
    setLoading(false);
  }, []);

  const fetchWaitList = useCallback(async () => {
    setWaitListLoading(true);
    const res = await fetch("/api/wait-list");
    if (res.ok) {
      const data = await res.json();
      setWaitList(data);
    }
    setWaitListLoading(false);
  }, []);

  const fetchStudents = useCallback(async () => {
    setStudentsLoading(true);
    const res = await fetch("/api/register");
    const data = await res.json();
    setStudents(data);
    setStudentsLoading(false);
  }, []);

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    const res = await fetch("/api/activities");
    const data = await res.json();
    setActivities(data);
    setActivitiesLoading(false);
  }, []);

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    const res = await fetch("/api/jobs");
    const data = await res.json();
    setJobsList(data);
    setJobsLoading(false);
  }, []);

  const fetchExperts = useCallback(async () => {
    setExpertsLoading(true);
    const res = await fetch("/api/experts");
    const data = await res.json();
    setExpertsList(data);
    setExpertsLoading(false);
  }, []);

  const fetchShortlinks = useCallback(async () => {
    setShortlinksLoading(true);
    const res = await fetch("/api/shortlinks");
    const data = await res.json();
    setShortlinks(data);
    setShortlinksLoading(false);
  }, []);

  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const res = await fetch("/api/lead-resource");
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch { setLeads([]); }
    setLeadsLoading(false);
  }, []);

  const fetchSystemUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/users", { headers: buildAuthHeader() });
      const data = await res.json();
      setSystemUsers(Array.isArray(data) ? data : []);
    } catch { setSystemUsers([]); }
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    fetchCourses();
    fetchStudents();
    fetchResources();
    fetchActivities();
    fetchJobs();
    fetchExperts();
    fetchShortlinks();
    fetchLeads();
    fetchWaitList();
    if (typeof window !== "undefined" && sessionStorage.getItem("admin_role") === "system_admin") {
      fetchSystemUsers();
    }
  }, [fetchCourses, fetchStudents, fetchResources, fetchActivities, fetchJobs, fetchExperts, fetchLeads, fetchWaitList, fetchSystemUsers]);

  function handleEdit(course: Course) {
    setEditing(course);
    const { id, ...rest } = course;
    setForm(rest);
    setShowForm(true);
  }

  function handleNew() {
    setEditing(null);
    setForm(emptyCourse);
    setShowForm(true);
  }

  async function handleSave() {
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      instructor: form.instructor || "Đội Ngũ Dứa Data",
      schedule: form.schedule || "",
      hours: form.hours || "",
      category: form.category || "",
      totalLessons: form.totalLessons || 0,
      students: form.students || 0,
      rating: form.rating || 0,
      reviews: form.reviews || 0,
      price: form.price || 0,
      originalPrice: form.originalPrice || 0,
      discount: form.discount || 0,
      curriculum: form.curriculum || [],
      outcomes: form.outcomes || [],
      targetAudience: form.targetAudience || [],
    };

    if (editing) {
      await fetch("/api/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: editing.id }),
      });
    } else {
      await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setShowForm(false);
    setEditing(null);
    setForm(emptyCourse);
    fetchCourses();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa khóa học này?")) return;
    await fetch(`/api/courses?id=${id}`, { method: "DELETE" });
    fetchCourses();
  }

  async function handlePublish(course: Course) {
    await fetch("/api/courses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: course.id, published: true }),
    });
    fetchCourses();
  }

  async function handleToggleComingSoon(course: Course) {
    await fetch("/api/courses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: course.id, comingSoon: !course.comingSoon }),
    });
    fetchCourses();
  }

  async function handleToggleHidden(course: Course) {
    await fetch("/api/courses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: course.id, isHidden: !course.isHidden }),
    });
    fetchCourses();
  }

  async function handleDuplicate(course: Course) {
    const { id, ...rest } = course;
    const payload = {
      ...rest,
      title: `${course.title} [Copy]`,
      slug: `${course.slug}-copy-${Date.now()}`,
      published: false,
      comingSoon: false,
    };
    await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    fetchCourses();
  }

  function addCurriculumItem() {
    if (!currTitle) return;
    const topics = currTopics.split("\n").map(t => t.trim()).filter(Boolean);
    const item: CurriculumItem = {
      phase: currPhase || `Giai đoạn ${form.curriculum.length + 1}`,
      title: currTitle,
      lessons: currLessons,
      topics: topics.length > 0 ? topics : undefined,
    };
    setForm({ ...form, curriculum: [...form.curriculum, item] });
    setCurrPhase("");
    setCurrTitle("");
    setCurrLessons(0);
    setCurrTopics("");
  }

  function removeCurriculumItem(index: number) {
    setForm({ ...form, curriculum: form.curriculum.filter((_, i) => i !== index) });
  }

  function moveCurriculumUp(index: number) {
    if (index === 0) return;
    const updated = [...form.curriculum];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setForm({ ...form, curriculum: updated });
  }

  function moveCurriculumDown(index: number) {
    if (index === form.curriculum.length - 1) return;
    const updated = [...form.curriculum];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setForm({ ...form, curriculum: updated });
  }

  function saveTopicsEdit(index: number) {
    const topics = editingTopicsValue.split("\n").map(t => t.trim()).filter(Boolean);
    const updated = [...form.curriculum];
    updated[index] = { ...updated[index], topics: topics.length > 0 ? topics : undefined };
    setForm({ ...form, curriculum: updated });
    setEditingTopicsIndex(null);
    setEditingTopicsValue("");
  }

  function startEditCurriculumItem(i: number) {
    setEditingCurriculumIndex(i);
    setEditCurriculumPhase(form.curriculum[i].phase);
    setEditCurriculumTitle(form.curriculum[i].title);
    setEditCurriculumLessons(form.curriculum[i].lessons);
  }

  function saveCurriculumItemEdit() {
    if (editingCurriculumIndex === null) return;
    const updated = [...form.curriculum];
    updated[editingCurriculumIndex] = {
      ...updated[editingCurriculumIndex],
      phase: editCurriculumPhase,
      title: editCurriculumTitle,
      lessons: editCurriculumLessons,
    };
    setForm({ ...form, curriculum: updated });
    setEditingCurriculumIndex(null);
  }

  function addOutcome() {
    if (!newOutcome) return;
    setForm({ ...form, outcomes: [...form.outcomes, newOutcome] });
    setNewOutcome("");
  }

  function removeOutcome(index: number) {
    setForm({ ...form, outcomes: form.outcomes.filter((_, i) => i !== index) });
  }

  function addTarget() {
    if (!newTarget) return;
    setForm({ ...form, targetAudience: [...form.targetAudience, newTarget] });
    setNewTarget("");
  }

  function removeTarget(index: number) {
    setForm({ ...form, targetAudience: form.targetAudience.filter((_, i) => i !== index) });
  }

  // Resource handlers
  function handleNewResource() {
    setEditingResource(null);
    setResourceForm(emptyResource);
    setShowResourceForm(true);
  }

  function handleEditResource(resource: Resource) {
    setEditingResource(resource);
    const { id, createdAt, updatedAt, ...rest } = resource;
    setResourceForm(rest);
    setShowResourceForm(true);
  }

  async function handleSaveResource() {
    const payload = {
      ...resourceForm,
      slug: resourceForm.slug || slugify(resourceForm.title),
    };

    const method = editingResource ? "PUT" : "POST";
    const body = editingResource ? { ...payload, id: editingResource.id } : payload;

    const res = await fetch("/api/resources", {
      method,
      headers: { "Content-Type": "application/json", ...buildAuthHeader() },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      alert(`${editingResource ? "Sửa" : "Thêm"} thất bại: ${err.error}`);
      return;
    }

    setShowResourceForm(false);
    setEditingResource(null);
    setResourceForm(emptyResource);
    fetchResources();
  }

  async function handleDeleteResource(id: string) {
    if (!confirm("Bạn có chắc muốn xóa tài nguyên này?")) return;
    await fetch(`/api/resources?id=${id}`, { method: "DELETE", headers: buildAuthHeader() });
    fetchResources();
  }

  // Activity handlers
  function handleNewActivity() {
    setEditingActivity(null);
    setActivityForm(emptyActivity);
    setShowActivityForm(true);
  }

  function handleEditActivity(activity: Activity) {
    setEditingActivity(activity);
    const { id, createdAt, updatedAt, ...rest } = activity;
    setActivityForm(rest);
    setShowActivityForm(true);
  }

  async function handleSaveActivity() {
    const method = editingActivity ? "PUT" : "POST";
    const body = editingActivity ? { ...activityForm, id: editingActivity.id } : activityForm;

    const res = await fetch("/api/activities", {
      method,
      headers: { "Content-Type": "application/json", ...buildAuthHeader() },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      alert(`${editingActivity ? "Sửa" : "Thêm"} hoạt động thất bại: ${err.error}`);
      return;
    }

    setShowActivityForm(false);
    setEditingActivity(null);
    setActivityForm(emptyActivity);
    fetchActivities();
  }

  async function handleDeleteActivity(id: string) {
    if (!confirm("Bạn có chắc muốn xóa hoạt động này?")) return;
    await fetch(`/api/activities?id=${id}`, { method: "DELETE", headers: buildAuthHeader() });
    fetchActivities();
  }

  // Job handlers
  function handleNewJob() {
    setEditingJob(null);
    setJobForm(emptyJob);
    setShowJobForm(true);
  }

  function handleEditJob(job: Job) {
    setEditingJob(job);
    const { id, createdAt, updatedAt, ...rest } = job;
    setJobForm(rest);
    setShowJobForm(true);
  }

  async function handleSaveJob() {
    const method = editingJob ? "PUT" : "POST";
    const body = editingJob ? { ...jobForm, id: editingJob.id } : jobForm;

    const res = await fetch("/api/jobs", {
      method,
      headers: { "Content-Type": "application/json", ...buildAuthHeader() },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      alert(`${editingJob ? "Sửa" : "Thêm"} việc làm thất bại: ${err.error}`);
      return;
    }

    setShowJobForm(false);
    setEditingJob(null);
    setJobForm(emptyJob);
    fetchJobs();
  }

  async function handleDeleteJob(id: string) {
    if (!confirm("Bạn có chắc muốn xóa việc làm này?")) return;
    await fetch(`/api/jobs?id=${id}`, { method: "DELETE", headers: buildAuthHeader() });
    fetchJobs();
  }

  // Expert handlers
  function handleNewExpert() {
    setEditingExpert(null);
    setExpertForm(emptyExpert);
    setShowExpertForm(true);
  }

  function handleEditExpert(expert: Expert) {
    setEditingExpert(expert);
    const { id, createdAt, updatedAt, ...rest } = expert;
    setExpertForm(rest);
    setShowExpertForm(true);
  }

  async function handleSaveExpert() {
    const method = editingExpert ? "PUT" : "POST";
    const body = editingExpert ? { ...expertForm, id: editingExpert.id } : expertForm;

    const res = await fetch("/api/experts", {
      method,
      headers: { "Content-Type": "application/json", ...buildAuthHeader() },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
      alert(`${editingExpert ? "Sửa" : "Thêm"} chuyên gia thất bại: ${err.error}`);
      return;
    }

    setShowExpertForm(false);
    setEditingExpert(null);
    setExpertForm(emptyExpert);
    fetchExperts();
  }

  async function handleDeleteExpert(id: string) {
    if (!confirm("Bạn có chắc muốn xóa chuyên gia này?")) return;
    await fetch(`/api/experts?id=${id}`, { method: "DELETE", headers: buildAuthHeader() });
    fetchExperts();
  }

  // Excel export helpers
  function downloadActivitiesExcel() {
    const data = activities.map((a, i) => ({
      "STT": i + 1,
      "Tiêu đề": a.title,
      "Cộng đồng": a.community === "student" ? "Học viên" : "GenZ Data",
      "Link đăng ký": a.registrationLink,
      "Hạn đăng ký": a.registrationDeadline ? new Date(a.registrationDeadline).toLocaleDateString("vi-VN") : "",
      "Ngày sự kiện": a.eventDate ? new Date(a.eventDate).toLocaleDateString("vi-VN") : "",
      "Tác giả": a.author,
      "Trạng thái": a.published ? "Đã xuất bản" : "Nháp",
      "Ngày tạo": a.createdAt ? new Date(a.createdAt).toLocaleDateString("vi-VN") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hoat dong");
    XLSX.writeFile(wb, `duadata-hoatdong-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function downloadJobsExcel() {
    const data = jobsList.map((j, i) => ({
      "STT": i + 1,
      "Tiêu đề": j.title,
      "Công ty": j.company,
      "Hình thức": j.workType,
      "Vị trí": j.position,
      "Địa điểm": j.location,
      "Lương": j.salary,
      "Link ứng tuyển": j.applicationLink,
      "Hạn nộp": j.applicationDeadline ? new Date(j.applicationDeadline).toLocaleDateString("vi-VN") : "",
      "Tác giả": j.author,
      "Trạng thái": j.published ? "Đã xuất bản" : "Nháp",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Viec lam");
    XLSX.writeFile(wb, `duadata-vieclam-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function downloadResourcesExcel() {
    const data = resources.map((r, i) => ({
      "STT": i + 1,
      "Tiêu đề": r.title,
      "Slug": r.slug,
      "Tóm tắt": r.summary,
      "Danh mục": r.category,
      "Tác giả": r.author,
      "Trạng thái": r.published ? "Đã xuất bản" : "Nháp",
      "Ngày tạo": r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tai nguyen");
    XLSX.writeFile(wb, `duadata-tailieunguon-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function downloadExpertsExcel() {
    const data = expertsList.map((e, i) => ({
      "STT": i + 1,
      "Tên": e.name,
      "Chức vụ": e.position,
      "Công việc trước đó": e.previousWork,
      "LinkedIn": e.linkedin,
      "Thứ tự": e.order,
      "Trạng thái": e.published ? "Hiển thị" : "Ẩn",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chuyen gia");
    XLSX.writeFile(wb, `duadata-chuyengia-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function downloadStudentsExcel() {
    const data = filteredStudents.map((s, i) => ({
      "STT": i + 1,
      "Họ và tên": s.fullName,
      "Số điện thoại": s.phone,
      "Email": s.email,
      "Facebook": s.facebook,
      "Ngày sinh": s.birthday,
      "Khóa học": s.courseName,
      "Ngày đăng ký": new Date(s.registeredAt).toLocaleString("vi-VN"),
      "Mã giới thiệu": s.referralCode,
      "Kỳ vọng / Ghi chú": s.expectations,
      "Trạng thái": processedStudents[s.id] ? "Đã xử lý" : "Chưa xử lý",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dang ky");
    XLSX.writeFile(wb, `duadata-dangky-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function downloadLeadsExcel() {
    const data = leads.map((l, i) => ({
      "STT": i + 1,
      "Họ và tên": l.fullName,
      "Email": l.email,
      "Vai trò": l.role,
      "Loại tài liệu": l.resourceType,
      "Ngày đăng ký": l.createdAt ? new Date(l.createdAt).toLocaleString("vi-VN") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nhan tai lieu");
    XLSX.writeFile(wb, `duadata-tailieu-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function downloadWaitListExcel() {
    const data = filteredWaitList.map((w, i) => ({
      "STT": i + 1,
      "Họ tên": w.name,
      "Số điện thoại": w.phone,
      "Email": w.email || "",
      "Khóa học": w.courseTitle,
      "Ngày đăng ký": new Date(w.registeredAt).toLocaleDateString("vi-VN"),
      "Giờ đăng ký": new Date(w.registeredAt).toLocaleTimeString("vi-VN"),
      "Trạng thái": w.status === "pending" ? "Chờ liên hệ" : w.status === "contacted" ? "Đã liên hệ" : "Đã chuyển đổi",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sach cho");
    XLSX.writeFile(wb, `duadata-danh-sach-cho-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // User management handlers
  function handleNewUser() {
    setEditingUser(null);
    setUserForm({ username: "", password: "", role: "sales_executive", name: "" });
    setShowUserForm(true);
  }
  function handleEditUser(user: any) {
    setEditingUser(user);
    setUserForm({ username: user.username || "", password: "", role: user.role || "sales_executive", name: user.name || "" });
    setShowUserForm(true);
  }
  async function handleSaveUser() {
    if (!userForm.username || !userForm.name || (!editingUser && !userForm.password)) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    const body: any = { username: userForm.username, role: userForm.role, name: userForm.name };
    if (userForm.password) body.password = userForm.password;
    if (editingUser) {
      await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json", ...buildAuthHeader() }, body: JSON.stringify({ id: editingUser.id, ...body }) });
    } else {
      await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json", ...buildAuthHeader() }, body: JSON.stringify(body) });
    }
    setShowUserForm(false);
    setEditingUser(null);
    setUserForm({ username: "", password: "", role: "sales_executive", name: "" });
    fetchSystemUsers();
  }
  async function handleDeleteUser(id: string) {
    if (!confirm("Bạn có chắc muốn xóa?")) return;
    await fetch(`/api/users?id=${id}`, { method: "DELETE", headers: buildAuthHeader() });
    fetchSystemUsers();
  }

  // Student filtering
  function filterStudents(): Student[] {
    let filtered = [...students];

    // Date filter
    const now = new Date();
    if (dateFilter === "today") {
      const todayStr = now.toISOString().slice(0, 10);
      filtered = filtered.filter(s => s.registeredAt.slice(0, 10) === todayStr);
    } else if (dateFilter === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(s => new Date(s.registeredAt) >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(s => new Date(s.registeredAt) >= monthAgo);
    } else if (dateFilter === "year") {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      filtered = filtered.filter(s => new Date(s.registeredAt) >= yearAgo);
    } else if (dateFilter === "custom" && customFrom && customTo) {
      const from = new Date(customFrom);
      const to = new Date(customTo);
      to.setHours(23, 59, 59);
      filtered = filtered.filter(s => {
        const d = new Date(s.registeredAt);
        return d >= from && d <= to;
      });
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.courseName.toLowerCase().includes(q)
      );
    }

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

    return filtered;
  }

  const filteredStudents = filterStudents();

  const filteredWaitList = waitList.filter(w => {
    const statusMatch = waitListFilter === "all" || w.status === waitListFilter;
    const courseMatch = waitListCourseFilter === "all" || w.courseId === waitListCourseFilter;
    return statusMatch && courseMatch;
  });

  const sidebarItems = [
    { key: "dashboard" as ActiveView, label: "Tổng quan", icon: "📊", count: 0 },
    { key: "courses" as ActiveView, label: "Quản lý khóa học", icon: "📚", count: courses.length },
    { key: "waitlist" as ActiveView, label: "Danh sách chờ", icon: "🔔", count: waitList.filter(w => w.status === "pending").length },
    { key: "students" as ActiveView, label: "Quản lý đăng ký", icon: "👥", count: students.length },
    { key: "resources" as ActiveView, label: "Quản lý tài nguyên", icon: "📝", count: resources.length },
    { key: "activities" as ActiveView, label: "Quản lý hoạt động", icon: "🎯", count: activities.length },
    { key: "jobs" as ActiveView, label: "Quản lý việc làm", icon: "💼", count: jobsList.length },
    { key: "experts" as ActiveView, label: "Đội ngũ chuyên gia", icon: "🏅", count: expertsList.length },
    { key: "shortlinks" as ActiveView, label: "Quản lý Shortlink", icon: "🔗", count: shortlinks.length },
    { key: "leads" as ActiveView, label: "Đăng ký nhận tài liệu", icon: "📩", count: leads.length },
    { key: "users" as ActiveView, label: "Quản lý người dùng", icon: "👤", count: systemUsers.length },
  ];

  // Role-based sidebar filtering
  const currentRole = typeof window !== "undefined" ? sessionStorage.getItem("admin_role") : null;
  const rolePermissionMap: Record<string, ActiveView[]> = {
    content_manager: ["dashboard", "activities", "resources", "jobs", "shortlinks"],
    sales_executive: ["dashboard", "waitlist", "students", "leads"],
    teaching_assistant: ["dashboard", "students", "courses"],
    system_admin: ["dashboard", "courses", "waitlist", "students", "resources", "activities", "jobs", "experts", "shortlinks", "leads", "users"],
  };
  const allowedViews = rolePermissionMap[currentRole || ""] || rolePermissionMap["system_admin"];
  const filteredSidebarItems = sidebarItems.filter(item => allowedViews.includes(item.key));
  const sidebarGroups = [
    { label: "Tổng quan", keys: ["dashboard"] as ActiveView[] },
    { label: "Học viên", keys: ["students", "leads"] as ActiveView[] },
    { label: "Khóa học", keys: ["courses", "waitlist", "activities", "experts"] as ActiveView[] },
    { label: "Tài nguyên", keys: ["resources", "shortlinks"] as ActiveView[] },
    { label: "Công việc", keys: ["jobs"] as ActiveView[] },
    { label: "Hệ thống", keys: ["users"] as ActiveView[] },
  ];
  const visibleGroups = sidebarGroups
    .map(g => ({ ...g, items: filteredSidebarItems.filter(i => g.keys.includes(i.key)) }))
    .filter(g => g.items.length > 0);

  // Dashboard stats
  const totalRevenue = courses.reduce((sum, c) => sum + (c.price * c.students), 0);
  const todayStudents = students.filter(s => s.registeredAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const weekStudents = students.filter(s => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(s.registeredAt) >= weekAgo;
  }).length;

  // Registration growth chart data (last 30 days)
  const chartData = (() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    students.forEach(s => {
      const day = s.registeredAt.slice(0, 10);
      if (day in days) days[day]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date,
      label: new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      registrations: count,
    }));
  })();

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          Đang kiểm tra quyền truy cập...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-green-400 tracking-tight">🍍 Dứa Data</Link>
            <span className="text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded-lg">Admin Panel</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${
              currentRole === "content_manager" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
              currentRole === "sales_executive" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
              currentRole === "teaching_assistant" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
              "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {currentRole === "content_manager" ? "Quản lý nội dung" :
               currentRole === "sales_executive" ? "Kinh doanh" :
               currentRole === "teaching_assistant" ? "Trợ giảng" :
               "Quản trị hệ thống"}
            </span>
          </div>
          <nav className="flex items-center gap-2 md:gap-4 text-xs md:text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-gray-900 transition hidden sm:inline">Trang chu</Link>
            <Link href="/courses" className="hover:text-gray-900 transition hidden sm:inline">Khóa học</Link>
            <button
              onClick={() => { sessionStorage.removeItem("admin_auth"); router.push("/admin/login"); }}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition text-xs font-medium"
            >
              Đăng xuất
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile sidebar toggle */}
      <div className="md:hidden px-4 py-3 border-b border-gray-200 bg-white">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded-lg w-full justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          Menu quan tri
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6">
        {/* Left Sidebar */}
        <div className={`${sidebarOpen ? "block" : "hidden"} md:block w-full md:w-60 flex-shrink-0`}>
          <div className="bg-white backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden md:sticky md:top-16">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Quan tri
              </h2>
            </div>
            <nav className="p-2">
              {visibleGroups.length > 1 ? (
                visibleGroups.map(group => (
                  <div key={group.label} className="mb-4">
                    <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{group.label}</div>
                    {group.items.map(item => (
                      <button
                        key={item.key}
                        onClick={() => { setActiveView(item.key); setSidebarOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between text-sm font-medium transition-all mb-0.5 ${
                          activeView === item.key
                            ? "bg-gradient-to-r from-green-500/15 to-emerald-500/10 text-green-600 border border-green-500/30 shadow-sm"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 border border-transparent"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                        {item.key !== "dashboard" && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            activeView === item.key ? "bg-green-500/20 text-green-600" : "bg-gray-100 text-gray-400"
                          }`}>
                            {item.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                filteredSidebarItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => { setActiveView(item.key); setSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between text-sm font-medium transition-all mb-0.5 ${
                      activeView === item.key
                        ? "bg-gradient-to-r from-green-500/15 to-emerald-500/10 text-green-600 border border-green-500/30 shadow-sm"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    {item.key !== "dashboard" && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeView === item.key ? "bg-green-500/20 text-green-600" : "bg-gray-100 text-gray-400"
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                ))
              )}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* === DASHBOARD VIEW === */}
          {activeView === "dashboard" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Xin chào! 👋</h1>
                  <p className="text-sm text-gray-500 mt-1">Đây là tổng quan hoạt động của Dứa Data hôm nay.</p>
                </div>
                <div className="hidden md:flex items-center gap-3 text-xs text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-3">
                  <span>📅</span>
                  <span>{new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="group bg-white border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all rounded-2xl p-5 cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">📚</div>
                    <span className="text-[10px] font-semibold bg-green-50 text-green-600 px-2.5 py-1 rounded-full border border-green-100">Active</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900">{courses.length}</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Khóa học</p>
                </div>
                <div className="group bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all rounded-2xl p-5 cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">👥</div>
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">+{todayStudents} hnay</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900">{students.length}</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Học viên đăng ký</p>
                </div>
                <div className="group bg-white border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all rounded-2xl p-5 cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">📝</div>
                    <span className="text-[10px] font-semibold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full border border-purple-100">{resources.length} bài</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900">{resources.length + activities.length}</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Tài nguyên & Hoạt động</p>
                </div>
                <div className="group bg-white border border-gray-200 hover:border-amber-300 hover:shadow-lg transition-all rounded-2xl p-5 cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">💼</div>
                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full border border-amber-100">{jobsList.length} VT</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900">{jobsList.length}</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Việc làm tuyển dụng</p>
                </div>
              </div>

              {/* Registration Growth Chart */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-sm">📈 Tăng trưởng đăng ký (30 ngày)</h3>
                  <span className="text-xs text-gray-500">{students.length} tổng đăng ký</span>
                </div>
                {chartData.every(d => d.registrations === 0) ? (
                  <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu đăng ký</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        interval={4}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#1f2937",
                          border: "none",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: "#9ca3af" }}
                        formatter={(value: unknown) => [`${value} đăng ký`, "Số lượng"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="registrations"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fill="url(#regGradient)"
                        dot={false}
                        activeDot={{ r: 4, fill: "#22c55e" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Recent registrations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-sm">Đăng ký gần đây</h3>
                    <button onClick={() => setActiveView("students")} className="text-xs text-green-400 hover:text-green-300 transition">Xem tất cả →</button>
                  </div>
                  {students.length === 0 ? (
                    <p className="text-sm text-gray-500">Chưa có đăng ký nào</p>
                  ) : (
                    <div className="space-y-3">
                      {students
                        .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
                        .slice(0, 5)
                        .map(s => (
                          <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-gray-900 text-xs font-bold">
                                {s.fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{s.fullName}</p>
                                <p className="text-[11px] text-gray-500">{s.courseName}</p>
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-500">
                              {new Date(s.registeredAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-sm">Thống kê nhanh</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-600">Đăng ký tuần này</span>
                        <span className="text-green-400 font-bold">{weekStudents}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all" style={{ width: `${Math.min(100, weekStudents * 10)}%` }} />
                      </div>
                    </div>
                    {courses.map(c => (
                      <div key={c.id}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-600 truncate mr-2">{c.title}</span>
                          <span className="text-blue-400 font-bold">{c.students} HV</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all" style={{ width: `${Math.min(100, (c.students / Math.max(1, ...courses.map(x => x.students))) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === COURSES VIEW === */}
          {activeView === "courses" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý khóa học</h1>
                <button
                  onClick={handleNew}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-gray-900 px-5 py-2.5 rounded-xl hover:from-green-600 hover:to-emerald-600 transition font-medium shadow-lg shadow-green-500/30"
                >
                  + Thêm khóa học
                </button>
              </div>

              {loading ? (
                <div className="text-center py-20 text-gray-600">Đang tải...</div>
              ) : courses.length === 0 ? (
                <div className="text-center py-20 text-gray-600">
                  <p className="text-xl mb-2">Chưa có khóa học nào</p>
                  <p>Nhấn &quot;+ Thêm khóa học&quot; để bắt đầu</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">Khóa học</th>
                        <th className="px-4 py-3 font-medium hidden md:table-cell">Danh mục</th>
                        <th className="px-4 py-3 font-medium hidden md:table-cell">Giá</th>
                        <th className="px-4 py-3 font-medium hidden md:table-cell">Học viên</th>
                        <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {courses.map((course) => (
                        <tr key={course.id} className="hover:bg-gray-100">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {course.imageUrl && (
                                <img src={course.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                              )}
                              <div>
                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                  {course.title}
                                  {course.published && (
                                    <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-full font-bold">Đã xuất bản</span>
                                  )}
                                  {course.comingSoon && (
                                    <span className="text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">Coming Soon</span>
                                  )}
                                  {course.isHidden && (
                                    <span className="text-[10px] bg-gray-500/10 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">Đã ẩn</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">{course.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">{course.category}</span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="font-medium text-green-600">{formatPrice(course.price)}</span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-gray-500">{course.students}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              {!course.published && (
                                <button onClick={() => handlePublish(course)} className="text-green-600 hover:text-green-800 font-medium text-xs bg-green-50 px-2 py-1 rounded-lg">Xuất bản</button>
                              )}
                              <button
                                onClick={() => handleToggleComingSoon(course)}
                                className={`text-xs font-medium px-2 py-1 rounded-lg ${course.comingSoon ? "bg-amber-100 text-amber-700" : "bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-600"}`}
                              >
                                {course.comingSoon ? "Tắt Sắp ra mắt" : "Sắp ra mắt"}
                              </button>
                              <button
                                onClick={() => handleToggleHidden(course)}
                                className={`text-xs font-medium px-2 py-1 rounded-lg ${course.isHidden ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-gray-50 text-gray-500 hover:bg-gray-200"}`}
                              >
                                {course.isHidden ? "Hiện" : "Ẩn"}
                              </button>
                              <button onClick={() => handleDuplicate(course)} className="text-purple-600 hover:text-purple-800 font-medium text-xs bg-purple-50 px-2 py-1 rounded-lg">Nhân bản</button>
                              <button onClick={() => handleEdit(course)} className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-2 py-1 rounded-lg">Sửa</button>
                              <button onClick={() => handleDelete(course.id)} className="text-red-500 hover:text-red-700 font-medium text-xs bg-red-50 px-2 py-1 rounded-lg">Xóa</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === STUDENTS VIEW === */}
          {activeView === "students" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý đăng ký</h1>
                <div className="flex items-center gap-3">
                  <button onClick={downloadStudentsExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl border border-green-700 hover:bg-green-700 transition font-medium text-sm">
                    📥 Tải Excel
                  </button>
                  <button
                    onClick={fetchStudents}
                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-200 transition font-medium text-sm"
                  >
                    🔄 Làm mới
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-sm font-medium text-gray-500">Lọc theo:</span>
                  {[
                    { key: "all" as DateFilter, label: "Tất cả" },
                    { key: "today" as DateFilter, label: "Hôm nay" },
                    { key: "week" as DateFilter, label: "Tuần này" },
                    { key: "month" as DateFilter, label: "Tháng này" },
                    { key: "year" as DateFilter, label: "Năm nay" },
                    { key: "custom" as DateFilter, label: "Tùy chọn" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setDateFilter(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        dateFilter === f.key
                          ? "bg-green-600 text-gray-900 shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {dateFilter === "custom" && (
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="date"
                      className="border rounded-lg px-3 py-1.5 text-sm"
                      value={customFrom}
                      onChange={e => setCustomFrom(e.target.value)}
                    />
                    <span className="text-gray-600 text-sm">đến</span>
                    <input
                      type="date"
                      className="border rounded-lg px-3 py-1.5 text-sm"
                      value={customTo}
                      onChange={e => setCustomTo(e.target.value)}
                    />
                  </div>
                )}

                <div className="relative">
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    placeholder="Tìm kiếm theo tên, email, SĐT, khóa học..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="mt-3 text-sm text-gray-500">
                  Hiển thị <span className="font-semibold text-gray-700">{filteredStudents.length}</span> / {students.length} đăng ký
                </div>
              </div>

              {/* Students Table */}
              {studentsLoading ? (
                <div className="text-center py-20 text-gray-600">Đang tải...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
                  <p className="text-lg mb-1">Không có đăng ký nào</p>
                  <p className="text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 text-gray-600 text-left">
                        <tr>
                          <th className="px-4 py-3 font-medium w-10">✓</th>
                          <th className="px-4 py-3 font-medium">Họ tên</th>
                          <th className="px-4 py-3 font-medium">Khóa học</th>
                          <th className="px-4 py-3 font-medium hidden md:table-cell">Email</th>
                          <th className="px-4 py-3 font-medium hidden md:table-cell">SĐT</th>
                          <th className="px-4 py-3 font-medium">Ngày ĐK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredStudents.map((student) => (
                          <>
                          <tr
                            key={student.id}
                            className={`hover:bg-gray-100 cursor-pointer transition ${processedStudents[student.id] ? "bg-green-50/50" : ""} ${expandedStudentId === student.id ? "bg-blue-50" : ""}`}
                            onClick={() => setExpandedStudentId(expandedStudentId === student.id ? null : student.id)}
                          >
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={!!processedStudents[student.id]}
                                onChange={() => toggleProcessed(student.id)}
                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className={`font-medium ${processedStudents[student.id] ? "text-gray-600 line-through" : "text-gray-800"}`}>{student.fullName}</div>
                              {student.referralCode && (
                                <div className="text-xs text-gray-500 mt-0.5">Mã GT: {student.referralCode}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                {student.courseName}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-gray-500">{student.email}</td>
                            <td className="px-4 py-3 hidden md:table-cell text-gray-500">{student.phone}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                              {new Date(student.registeredAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                              <br />
                              {new Date(student.registeredAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </td>
                          </tr>
                          {expandedStudentId === student.id && (
                            <tr key={`${student.id}-detail`} className="bg-blue-50/60">
                              <td colSpan={6} className="px-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600 text-xs block mb-0.5">Họ tên</span>
                                    <span className="font-medium text-gray-900">{student.fullName}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 text-xs block mb-0.5">Email</span>
                                    <span className="text-gray-700">{student.email || "—"}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 text-xs block mb-0.5">Số điện thoại</span>
                                    <span className="text-gray-700">{student.phone || "—"}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 text-xs block mb-0.5">Facebook</span>
                                    {student.facebook ? (
                                      <a href={student.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                        {student.facebook}
                                      </a>
                                    ) : <span className="text-gray-600">—</span>}
                                  </div>
                                  <div>
                                    <span className="text-gray-600 text-xs block mb-0.5">Ngày sinh</span>
                                    <span className="text-gray-700">{student.birthday || "—"}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 text-xs block mb-0.5">Mã giới thiệu</span>
                                    <span className="text-gray-700">{student.referralCode || "—"}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 text-xs block mb-0.5">Khóa học đăng ký</span>
                                    <span className="text-green-700 font-medium">{student.courseName}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 text-xs block mb-0.5">Ngày đăng ký</span>
                                    <span className="text-gray-700">{new Date(student.registeredAt).toLocaleString("vi-VN")}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 text-xs block mb-0.5">Trạng thái</span>
                                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${processedStudents[student.id] ? "bg-green-500/10 text-green-400" : "bg-yellow-100 text-yellow-700"}`}>
                                      {processedStudents[student.id] ? "✓ Đã xử lý" : "⏳ Chưa xử lý"}
                                    </span>
                                  </div>
                                  {student.expectations && (
                                    <div className="md:col-span-2 lg:col-span-3">
                                      <span className="text-gray-600 text-xs block mb-0.5">Kỳ vọng / Ghi chú</span>
                                      <span className="text-gray-700">{student.expectations}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === RESOURCES VIEW === */}
          {activeView === "resources" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý tài nguyên</h1>
                <div className="flex items-center gap-3">
                  <button onClick={downloadResourcesExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl border border-green-700 hover:bg-green-700 transition font-medium text-sm">
                    📥 Tải Excel
                  </button>
                  <button
                    onClick={handleNewResource}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-gray-900 px-5 py-2.5 rounded-xl hover:from-green-600 hover:to-emerald-600 transition font-medium shadow-lg shadow-green-500/30"
                  >
                    + Thêm tài nguyên
                  </button>
                </div>
              </div>

              {resourcesLoading ? (
                <div className="text-center py-20 text-gray-600">Đang tải...</div>
              ) : resources.length === 0 ? (
                <div className="text-center py-20 text-gray-600">
                  <p className="text-xl mb-2">Chưa có tài nguyên nào</p>
                  <p>Nhấn &quot;+ Thêm tài nguyên&quot; để bắt đầu</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">Tiêu đề</th>
                        <th className="px-4 py-3 font-medium hidden md:table-cell">Danh mục</th>
                        <th className="px-4 py-3 font-medium hidden md:table-cell">Trạng thái</th>
                        <th className="px-4 py-3 font-medium hidden md:table-cell">Ngày tạo</th>
                        <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {resources.map((resource) => (
                        <tr key={resource.id} className="hover:bg-gray-100/80 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {resource.imageUrl ? (
                                <img src={resource.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 text-sm">📝</div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900 line-clamp-1">{resource.title}</p>
                                <p className="text-xs text-gray-600 line-clamp-1">{resource.summary}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-gray-500">{resource.category}</td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              resource.published ? "bg-green-500/10 text-green-400" : "bg-gray-100 text-gray-500"
                            }`}>
                              {resource.published ? "Đã xuất bản" : "Nháp"}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">
                            {new Date(resource.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleEditResource(resource)}
                              className="text-blue-600 hover:text-blue-800 mr-3 text-xs font-medium"
                            >Sửa</button>
                            <button
                              onClick={() => handleDeleteResource(resource.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >Xóa</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* === ACTIVITIES VIEW === */}
          {activeView === "activities" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý hoạt động cộng đồng</h1>
                <div className="flex items-center gap-3">
                  <button onClick={downloadActivitiesExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl border border-green-700 hover:bg-green-700 transition font-medium text-sm">
                    📥 Tải Excel
                  </button>
                  <button onClick={handleNewActivity} className="bg-green-600 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
                    + Thêm hoạt động
                  </button>
                </div>
              </div>

              {activitiesLoading ? (
                <div className="text-center py-10 text-gray-600">Đang tải...</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
                  <p className="text-lg">Chưa có hoạt động nào</p>
                  <p className="text-sm mt-1">Nhấn &quot;+ Thêm hoạt động&quot; để tạo mới</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Tiêu đề</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Cộng đồng</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Ngày sự kiện</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Trạng thái</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(act => (
                        <tr key={act.id} className="hover:bg-gray-100">
                          <td className="px-4 py-3 font-medium text-gray-900">{act.title}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${act.community === "student" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                              {act.community === "student" ? "Học viên" : "GenZ Data"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{act.eventDate ? new Date(act.eventDate).toLocaleDateString("vi-VN") : "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${act.published ? "bg-green-500/10 text-green-400" : "bg-gray-100 text-gray-500"}`}>
                              {act.published ? "Đã xuất bản" : "Nháp"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleEditActivity(act)} className="text-blue-600 hover:text-blue-800 mr-3 text-xs font-medium">Sửa</button>
                            <button onClick={() => handleDeleteActivity(act.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Xóa</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* === JOBS VIEW === */}
          {activeView === "jobs" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý việc làm</h1>
                <div className="flex items-center gap-3">
                  <button onClick={downloadJobsExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl border border-green-700 hover:bg-green-700 transition font-medium text-sm">
                    📥 Tải Excel
                  </button>
                  <button onClick={handleNewJob} className="bg-green-600 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
                    + Thêm việc làm
                  </button>
                </div>
              </div>

              {jobsLoading ? (
                <div className="text-center py-10 text-gray-600">Đang tải...</div>
              ) : jobsList.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
                  <p className="text-lg">Chưa có việc làm nào</p>
                  <p className="text-sm mt-1">Nhấn &quot;+ Thêm việc làm&quot; để tạo mới</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Tiêu đề</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Công ty</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Hình thức</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Hạn nộp</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Trạng thái</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {jobsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(job => (
                        <tr key={job.id} className="hover:bg-gray-100">
                          <td className="px-4 py-3 font-medium text-gray-900">{job.title}</td>
                          <td className="px-4 py-3 text-gray-500">{job.company}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{job.workType}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString("vi-VN") : "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${job.published ? "bg-green-500/10 text-green-400" : "bg-gray-100 text-gray-500"}`}>
                              {job.published ? "Đã xuất bản" : "Nháp"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleEditJob(job)} className="text-blue-600 hover:text-blue-800 mr-3 text-xs font-medium">Sửa</button>
                            <button onClick={() => handleDeleteJob(job.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Xóa</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {/* === EXPERTS VIEW === */}
          {activeView === "experts" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Đội ngũ chuyên gia</h1>
                <div className="flex items-center gap-3">
                  <button onClick={downloadExpertsExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl border border-green-700 hover:bg-green-700 transition font-medium text-sm">
                    📥 Tải Excel
                  </button>
                  <button onClick={handleNewExpert} className="bg-green-600 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
                    + Thêm chuyên gia
                  </button>
                </div>
              </div>

              {expertsLoading ? (
                <div className="text-center py-10 text-gray-600">Đang tải...</div>
              ) : expertsList.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
                  <p className="text-lg">Chưa có chuyên gia nào</p>
                  <p className="text-sm mt-1">Nhấn &quot;+ Thêm chuyên gia&quot; để tạo mới</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expertsList.sort((a, b) => (a.order || 0) - (b.order || 0)).map(expert => (
                    <div key={expert.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col items-center text-center">
                      {expert.avatarUrl ? (
                        <img src={expert.avatarUrl} alt={expert.name} className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-green-500/30" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-3xl mb-3">
                          {expert.name.charAt(0)}
                        </div>
                      )}
                      <h3 className="text-gray-900 font-bold">{expert.name}</h3>
                      <p className="text-green-400 text-sm">{expert.position}</p>
                      {expert.previousWork && <p className="text-gray-500 text-xs mt-1">{expert.previousWork}</p>}
                      <p className="text-gray-500 text-xs mt-1">Thứ tự: {expert.order}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-2 ${expert.published ? "bg-green-500/10 text-green-400" : "bg-gray-100 text-gray-500"}`}>
                        {expert.published ? "Hiển thị" : "Ẩn"}
                      </span>
                      <div className="flex gap-3 mt-3">
                        <button onClick={() => handleEditExpert(expert)} className="text-blue-400 hover:text-blue-300 text-xs font-medium">Sửa</button>
                        <button onClick={() => handleDeleteExpert(expert.id)} className="text-red-400 hover:text-red-300 text-xs font-medium">Xóa</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeView === "shortlinks" && (
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý Shortlink</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-sm text-gray-500">Tổng lượt click: <span className="font-semibold text-gray-700">{shortlinks.reduce((s, l) => s + (l.clicks || 0), 0).toLocaleString()}</span></div>
                  <button
                    onClick={async () => {
                      if (!confirm("Xóa tất cả shortlink có 0 lượt xem?")) return;
                      const res = await fetch("/api/cleanup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "clean_shortlinks_zero_views" }),
                      });
                      const data = await res.json();
                      alert(`Đã xóa ${data.deleted} shortlink có 0 lượt xem`);
                      fetchShortlinks();
                    }}
                    className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition"
                  >
                    🗑️ Xóa shortlink 0 lượt xem
                  </button>
                </div>
              </div>

              {shortlinksLoading ? (
                <div className="text-center py-10 text-gray-600">Đang tải...</div>
              ) : shortlinks.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
                  <p className="text-lg">Chưa có shortlink nào</p>
                  <p className="text-sm mt-1">Tạo shortlink tại <a href="/shortlink" className="text-green-600 underline">/shortlink</a></p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Tên</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Short URL</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">URL gốc</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-700">Lượt click</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-700">Ngày tạo</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-700">Xoá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shortlinks.map(link => (
                        <tr key={link.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-gray-900 font-medium max-w-[150px] truncate">{link.title}</td>
                          <td className="px-4 py-3">
                            <code className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs">/s/{link.code}</code>
                          </td>
                          <td className="px-4 py-3 text-gray-500 max-w-[250px] truncate text-xs">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition">{link.url}</a>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">
                              👁 {(link.clicks || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500 text-xs">
                            {link.createdAt ? new Date(link.createdAt).toLocaleDateString("vi-VN") : "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={async () => {
                                if (!confirm("Xoá shortlink này?")) return;
                                await fetch(`/api/shortlinks?id=${link.id}`, { method: "DELETE" });
                                fetchShortlinks();
                              }}
                              className="text-red-400 hover:text-red-600 text-xs font-medium"
                            >
                              Xoá
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {/* === LEADS VIEW === */}
          {activeView === "leads" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Đăng ký nhận tài liệu</h1>
                <div className="flex items-center gap-3">
                  <button onClick={downloadLeadsExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl border border-green-700 hover:bg-green-700 transition font-medium text-sm">
                    📥 Tải Excel
                  </button>
                  <button
                    onClick={fetchLeads}
                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-200 transition font-medium text-sm"
                  >
                    Làm mới
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Xóa tất cả đăng ký có email sample@email.tst?")) return;
                      const res = await fetch("/api/cleanup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "clean_test_emails" }),
                      });
                      const data = await res.json();
                      alert(`Đã xóa ${data.totalDeleted} bản ghi có email test (${data.email})`);
                      fetchLeads();
                    }}
                    className="bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-xl text-xs font-medium hover:bg-red-100 transition"
                  >
                    🗑️ Xóa email test
                  </button>
                </div>
              </div>

              {leadsLoading ? (
                <div className="text-center py-20 text-gray-600">Dang tai...</div>
              ) : leads.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
                  <p className="text-lg">Chua co dang ky nao</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 text-sm text-gray-500">
                    Tong: <span className="font-semibold text-gray-700">{leads.length}</span> dang ky
                  </div>
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Ho ten</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Vai tro</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Loai tai lieu</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Ngay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {leads
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map(lead => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{lead.fullName}</td>
                          <td className="px-4 py-3 text-gray-600">{lead.email}</td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">{lead.role}</span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full font-medium">{lead.resourceType}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("vi-VN") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* === WAITLIST VIEW === */}
          {activeView === "waitlist" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">📋 Danh sách chờ — Khóa học sắp ra mắt</h1>
                <div className="flex items-center gap-3">
                  <button onClick={downloadWaitListExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl border border-green-700 hover:bg-green-700 transition font-medium text-sm">
                    📥 Tải Excel
                  </button>
                  <button onClick={fetchWaitList} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-200 transition font-medium text-sm">
                    🔄 Làm mới
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Tổng đăng ký", value: waitList.length, color: "blue" },
                  { label: "Chờ liên hệ", value: waitList.filter(w => w.status === "pending").length, color: "amber" },
                  { label: "Đã liên hệ", value: waitList.filter(w => w.status === "contacted").length, color: "green" },
                  { label: "Đã chuyển đổi", value: waitList.filter(w => w.status === "converted").length, color: "emerald" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
                    <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">Lọc theo trạng thái:</span>
                  {[
                    { key: "all", label: "Tất cả" },
                    { key: "pending", label: "Chờ liên hệ" },
                    { key: "contacted", label: "Đã liên hệ" },
                    { key: "converted", label: "Đã chuyển đổi" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setWaitListFilter(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        waitListFilter === f.key
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}

                  <span className="ml-4 text-sm font-medium text-gray-500">Theo khóa học:</span>
                  <select
                    value={waitListCourseFilter}
                    onChange={(e) => setWaitListCourseFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tất cả khóa học</option>
                    {courses.filter(c => c.comingSoon).map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {waitListLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
                </div>
              ) : filteredWaitList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <div className="text-5xl mb-4">📋</div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">Chưa có ai đăng ký chờ</h3>
                  <p className="text-sm text-gray-400">Danh sách chờ sẽ hiển thị ở đây khi có người đăng ký nhận thông báo khóa học sắp ra mắt.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left font-bold text-gray-600 text-xs uppercase tracking-wider">STT</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-600 text-xs uppercase tracking-wider">Họ tên</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-600 text-xs uppercase tracking-wider">Điện thoại</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-600 text-xs uppercase tracking-wider hidden md:table-cell">Email</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-600 text-xs uppercase tracking-wider">Khóa học</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-600 text-xs uppercase tracking-wider">Ngày đăng ký</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-600 text-xs uppercase tracking-wider">Trạng thái</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-600 text-xs uppercase tracking-wider">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWaitList.map((entry, i) => (
                          <tr key={entry.id} className="hover:bg-gray-50 border-b border-gray-100">
                            <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{entry.name}</td>
                            <td className="px-4 py-3">
                              <a href={`tel:${entry.phone}`} className="text-blue-600 hover:underline">{entry.phone}</a>
                            </td>
                            <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{entry.email || "—"}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">{entry.courseTitle}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              <div>{new Date(entry.registeredAt).toLocaleDateString("vi-VN")}</div>
                              <div className="text-gray-400">{new Date(entry.registeredAt).toLocaleTimeString("vi-VN")}</div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={entry.status}
                                onChange={async (e) => {
                                  await fetch("/api/wait-list", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ courseId: entry.courseId, entryId: entry.id, status: e.target.value }),
                                  });
                                  fetchWaitList();
                                }}
                                className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${
                                  entry.status === "pending" ? "bg-amber-100 text-amber-700" :
                                  entry.status === "contacted" ? "bg-green-100 text-green-700" :
                                  "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                <option value="pending">Chờ liên hệ</option>
                                <option value="contacted">Đã liên hệ</option>
                                <option value="converted">Đã chuyển đổi</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <a
                                  href={`tel:${entry.phone}`}
                                  className="text-green-600 hover:text-green-800 font-medium text-xs bg-green-50 px-2 py-1 rounded-lg"
                                  title="Gọi điện"
                                >
                                  📞 Gọi
                                </a>
                                <a
                                  href={`https://zalo.me/${entry.phone.replace(/^0/, "84")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-2 py-1 rounded-lg"
                                  title="Nhắn Zalo"
                                >
                                  💬 Zalo
                                </a>
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Xóa đăng ký của "${entry.name}"?`)) return;
                                    await fetch(`/api/wait-list?courseId=${entry.courseId}&entryId=${entry.id}`, { method: "DELETE" });
                                    fetchWaitList();
                                  }}
                                  className="text-red-500 hover:text-red-700 font-medium text-xs bg-red-50 px-2 py-1 rounded-lg"
                                  title="Xóa"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === USERS VIEW === */}
          {activeView === "users" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng hệ thống</h1>
                <button onClick={handleNewUser} className="bg-gradient-to-r from-green-500 to-emerald-500 text-gray-900 px-5 py-2.5 rounded-xl hover:from-green-600 hover:to-emerald-600 transition font-medium shadow-lg shadow-green-500/30">
                  + Thêm người dùng
                </button>
              </div>
              {usersLoading ? (
                <div className="text-center py-20 text-gray-600">Đang tải...</div>
              ) : (
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <input type="text" className="border rounded-lg px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="Tìm theo tên hoặc username..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                    <button onClick={fetchSystemUsers} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-200 transition font-medium text-sm">🔄 Làm mới</button>
                  </div>
                  {systemUsers.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200"><p className="text-lg">Chưa có người dùng nào</p></div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 text-gray-600 text-left">
                            <tr><th className="px-4 py-3 font-medium">Tên</th><th className="px-4 py-3 font-medium">Username</th><th className="px-4 py-3 font-medium">Vai trò</th><th className="px-4 py-3 font-medium hidden md:table-cell">Ngày tạo</th><th className="px-4 py-3 font-medium text-right">Thao tác</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {systemUsers.filter(u => !userSearch || (u.name?.toLowerCase().includes(userSearch.toLowerCase())) || (u.username?.toLowerCase().includes(userSearch.toLowerCase()))).map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">{user.name?.charAt(0) || "?"}</div><span className="font-medium text-gray-900">{user.name}</span></div></td>
                                <td className="px-4 py-3 text-gray-500">{user.username}</td>
                                <td className="px-4 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${user.role === "system_admin" ? "bg-red-500/10 text-red-600" : user.role === "content_manager" ? "bg-purple-500/10 text-purple-600" : user.role === "sales_executive" ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"}`}>{ROLE_LABELS[user.role as UserRole] || user.role}</span></td>
                                <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}</td>
                                <td className="px-4 py-3 text-right"><button onClick={() => handleEditUser(user)} className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-2 py-1 rounded-lg mr-2">Sửa</button><button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700 font-medium text-xs bg-red-50 px-2 py-1 rounded-lg">Xóa</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resource Form Modal */}
      {showResourceForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 p-6 mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                {editingResource ? "Sửa tài nguyên" : "Thêm tài nguyên mới"}
              </h2>
              <button onClick={() => setShowResourceForm(false)} className="text-gray-600 hover:text-gray-500 text-2xl">&times;</button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={resourceForm.title}
                    onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                    placeholder="VD: Hướng dẫn sử dụng Power BI"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug (tự tạo nếu bỏ trống)</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={resourceForm.slug}
                    onChange={(e) => setResourceForm({ ...resourceForm, slug: e.target.value })}
                    placeholder="huong-dan-su-dung-power-bi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tóm tắt</label>
                <input
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                  value={resourceForm.summary}
                  onChange={(e) => setResourceForm({ ...resourceForm, summary: e.target.value })}
                  placeholder="Mô tả ngắn gọn về tài nguyên"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung *</label>
                <RichTextEditor
                  value={resourceForm.content}
                  onChange={(content) => setResourceForm({ ...resourceForm, content })}
                  placeholder="Nhập nội dung bài viết..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <select
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={resourceForm.category}
                    onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                  >
                    <option value="Article">Bài viết</option>
                    <option value="Tutorial">Hướng dẫn</option>
                    <option value="Template">Template</option>
                    <option value="Tool">Công cụ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tác giả</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={resourceForm.author}
                    onChange={(e) => setResourceForm({ ...resourceForm, author: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={resourceForm.published ? "true" : "false"}
                    onChange={(e) => setResourceForm({ ...resourceForm, published: e.target.value === "true" })}
                  >
                    <option value="true">Xuất bản</option>
                    <option value="false">Nháp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh bìa (URL)</label>
                <input
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                  value={resourceForm.imageUrl}
                  onChange={(e) => setResourceForm({ ...resourceForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                {resourceForm.imageUrl && (
                  <img src={resourceForm.imageUrl} alt="Preview" className="mt-2 w-full h-40 object-cover rounded-lg" />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowResourceForm(false)} className="px-5 py-2 rounded-lg border text-gray-500 hover:bg-gray-100 transition">Hủy</button>
              <button onClick={handleSaveResource} className="px-5 py-2 rounded-lg bg-green-600 text-gray-900 font-medium hover:bg-green-700 transition shadow">
                {editingResource ? "Cập nhật" : "Tạo tài nguyên"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? "Chỉnh sửa khóa học" : "Thêm khóa học mới"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-600 hover:text-gray-500 text-2xl">×</button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên khóa học *</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="VD: Lập trình Python cơ bản"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug (tự tạo nếu bỏ trống)</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="lap-trinh-python-co-ban"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                <input
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                <textarea
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đường link ảnh minh hoạ khóa học</label>
                <div className="flex items-center gap-4">
                  {form.imageUrl && (
                    <div className="w-24 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.imageUrl || ""}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://example.com/course-image.jpg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="VD: Lập trình"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giảng viên</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.instructor}
                    onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
                  <input
                    type="number"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá gốc</label>
                  <input
                    type="number"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giảm giá (%)</label>
                  <input
                    type="number"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tổng bài học</label>
                  <input
                    type="number"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.totalLessons}
                    onChange={(e) => setForm({ ...form, totalLessons: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Học viên</label>
                  <input
                    type="number"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.students}
                    onChange={(e) => setForm({ ...form, students: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số đánh giá</label>
                  <input
                    type="number"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.reviews}
                    onChange={(e) => setForm({ ...form, reviews: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày khai giảng</label>
                  <input
                    type="date"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lịch học</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.schedule}
                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                    placeholder="Thứ 2, 4, 6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ học</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    placeholder="20:00 - 22:00"
                  />
                </div>
              </div>

              {/* Curriculum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lộ trình học</label>
                {form.curriculum.map((item, i) => (
                  <div key={i} className="mb-3 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {/* Edit form for phase/title/lessons */}
                    {editingCurriculumIndex === i ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            className="border rounded px-2 py-1.5 text-sm w-28"
                            placeholder="Giai đoạn"
                            value={editCurriculumPhase}
                            onChange={(e) => setEditCurriculumPhase(e.target.value)}
                          />
                          <input
                            className="border rounded px-2 py-1.5 text-sm flex-1"
                            placeholder="Tên chương"
                            value={editCurriculumTitle}
                            onChange={(e) => setEditCurriculumTitle(e.target.value)}
                          />
                          <input
                            type="number"
                            className="border rounded px-2 py-1.5 text-sm w-20"
                            placeholder="Số bài"
                            value={editCurriculumLessons}
                            onChange={(e) => setEditCurriculumLessons(Number(e.target.value))}
                          />
                          <button
                            onClick={saveCurriculumItemEdit}
                            className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingCurriculumIndex(null)}
                            className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-300"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-medium text-green-600">{item.phase}:</span>
                        <span className="flex-1 font-medium">{item.title}</span>
                        <span className="text-gray-600">{item.lessons} bài</span>
                        <button onClick={() => moveCurriculumUp(i)} className="text-gray-400 hover:text-gray-700 text-xs px-1" title="Lên">▲</button>
                        <button onClick={() => moveCurriculumDown(i)} className="text-gray-400 hover:text-gray-700 text-xs px-1" title="Xuống">▼</button>
                        <button
                          onClick={() => {
                            setEditingTopicsIndex(editingTopicsIndex === i ? null : i);
                            setEditingTopicsValue((item.topics || []).join("\n"));
                          }}
                          className="text-blue-500 hover:text-blue-700 text-xs font-medium px-1"
                        >
                          {editingTopicsIndex === i ? "Đóng ND" : "Sửa ND"}
                        </button>
                        <button
                          onClick={() => startEditCurriculumItem(i)}
                          className="text-purple-500 hover:text-purple-700 text-xs font-medium px-1"
                        >
                          Sửa
                        </button>
                        <button onClick={() => removeCurriculumItem(i)} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
                      </div>
                    )}
                    {item.topics && item.topics.length > 0 && editingTopicsIndex !== i && editingCurriculumIndex !== i && (
                      <div className="mt-2 pl-4 border-l-2 border-green-200 space-y-0.5">
                        {item.topics.map((topic, j) => (
                          <p key={j} className="text-xs text-gray-500">• {topic}</p>
                        ))}
                      </div>
                    )}
                    {editingTopicsIndex === i && (
                      <div className="mt-2">
                        <textarea
                          className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                          rows={4}
                          value={editingTopicsValue}
                          onChange={(e) => setEditingTopicsValue(e.target.value)}
                          placeholder="Mỗi dòng là 1 nội dung học"
                        />
                        <button
                          onClick={() => saveTopicsEdit(i)}
                          className="mt-1 bg-green-600 text-gray-900 px-3 py-1 rounded text-xs font-medium hover:bg-green-700"
                        >
                          Lưu nội dung
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <div className="space-y-2 mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-medium text-green-700">Thêm giai đoạn mới</p>
                  <div className="flex gap-2">
                    <input className="border rounded px-2 py-1.5 text-sm w-28" placeholder="Giai đoạn" value={currPhase} onChange={(e) => setCurrPhase(e.target.value)} />
                    <input className="border rounded px-2 py-1.5 text-sm flex-1" placeholder="Tên chương" value={currTitle} onChange={(e) => setCurrTitle(e.target.value)} />
                    <input type="number" className="border rounded px-2 py-1.5 text-sm w-20" placeholder="Số bài" value={currLessons} onChange={(e) => setCurrLessons(Number(e.target.value))} />
                  </div>
                  <textarea
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    rows={3}
                    value={currTopics}
                    onChange={(e) => setCurrTopics(e.target.value)}
                    placeholder="Nội dung học (mỗi dòng 1 nội dung)"
                  />
                  <button onClick={addCurriculumItem} className="bg-green-600 text-gray-900 px-4 py-1.5 rounded text-sm font-medium hover:bg-green-700">+ Thêm giai đoạn</button>
                </div>
              </div>

              {/* Outcomes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kết quả đạt được</label>
                {form.outcomes.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1 text-sm">
                    <span className="flex-1 bg-gray-50 p-2 rounded">{item}</span>
                    <button onClick={() => removeOutcome(i)} className="text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input
                    className="border rounded px-2 py-1.5 text-sm flex-1"
                    placeholder="Thêm kết quả đạt được"
                    value={newOutcome}
                    onChange={(e) => setNewOutcome(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addOutcome()}
                  />
                  <button onClick={addOutcome} className="bg-green-500/10 text-green-400 px-3 py-1.5 rounded text-sm font-medium hover:bg-green-200">+</button>
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Đối tượng phù hợp</label>
                {form.targetAudience.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1 text-sm">
                    <span className="flex-1 bg-gray-50 p-2 rounded">{item}</span>
                    <button onClick={() => removeTarget(i)} className="text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input
                    className="border rounded px-2 py-1.5 text-sm flex-1"
                    placeholder="Thêm đối tượng"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTarget()}
                  />
                  <button onClick={addTarget} className="bg-green-500/10 text-green-400 px-3 py-1.5 rounded text-sm font-medium hover:bg-green-200">+</button>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 mt-4 flex-wrap">
              {editing && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Xuat ban:</label>
                  <button
                    onClick={() => setForm({ ...form, published: !form.published })}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${form.published ? "bg-green-500/10 text-green-400" : "bg-gray-100 text-gray-500"}`}
                  >
                    {form.published ? "Đã xuất bản" : "Nháp"}
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Coming Soon:</label>
                <button
                  onClick={() => setForm({ ...form, comingSoon: !form.comingSoon })}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${form.comingSoon ? "bg-amber-500/10 text-amber-600" : "bg-gray-100 text-gray-500"}`}
                >
                  {form.comingSoon ? "Bat" : "Tat"}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-lg border text-gray-500 hover:bg-gray-100 transition">Hủy</button>
              <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-green-600 text-gray-900 font-medium hover:bg-green-700 transition shadow">
                {editing ? "Cập nhật" : "Tạo khóa học"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Form Modal */}
      {showActivityForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 p-6 mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                {editingActivity ? "Sửa hoạt động" : "Thêm hoạt động mới"}
              </h2>
              <button onClick={() => setShowActivityForm(false)} className="text-gray-600 hover:text-gray-500 text-2xl">&times;</button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                <input
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                  value={activityForm.title}
                  onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                  placeholder="VD: Workshop Data Analysis"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tóm tắt</label>
                <input
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                  value={activityForm.summary}
                  onChange={(e) => setActivityForm({ ...activityForm, summary: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết (HTML)</label>
                <textarea
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                  rows={6}
                  value={activityForm.content}
                  onChange={(e) => setActivityForm({ ...activityForm, content: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh minh hoạ (URL)</label>
                <input
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                  value={activityForm.imageUrl}
                  onChange={(e) => setActivityForm({ ...activityForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cộng đồng *</label>
                  <select
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={activityForm.community}
                    onChange={(e) => setActivityForm({ ...activityForm, community: e.target.value as "student" | "genz" })}
                  >
                    <option value="student">Cộng đồng học viên</option>
                    <option value="genz">GenZ làm Data</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sự kiện</label>
                  <input
                    type="date"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={activityForm.eventDate}
                    onChange={(e) => setActivityForm({ ...activityForm, eventDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link đăng ký</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={activityForm.registrationLink}
                    onChange={(e) => setActivityForm({ ...activityForm, registrationLink: e.target.value })}
                    placeholder="https://forms.gle/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hạn đăng ký</label>
                  <input
                    type="date"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={activityForm.registrationDeadline}
                    onChange={(e) => setActivityForm({ ...activityForm, registrationDeadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Xuất bản:</label>
                <button
                  type="button"
                  onClick={() => setActivityForm({ ...activityForm, published: !activityForm.published })}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${activityForm.published ? "bg-green-500/10 text-green-400" : "bg-gray-100 text-gray-500"}`}
                >
                  {activityForm.published ? "Đã xuất bản" : "Nháp"}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowActivityForm(false)} className="px-5 py-2 rounded-lg border text-gray-500 hover:bg-gray-100 transition">Hủy</button>
              <button onClick={handleSaveActivity} className="px-5 py-2 rounded-lg bg-green-600 text-gray-900 font-medium hover:bg-green-700 transition shadow">
                {editingActivity ? "Cập nhật" : "Tạo hoạt động"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Form Modal */}
      {showJobForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 p-6 mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                {editingJob ? "Sửa việc làm" : "Thêm việc làm mới"}
              </h2>
              <button onClick={() => setShowJobForm(false)} className="text-gray-600 hover:text-gray-500 text-2xl">&times;</button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    placeholder="VD: Data Analyst Intern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Công ty *</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={jobForm.company}
                    onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                    placeholder="VD: FPT Software"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tóm tắt</label>
                <input
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                  value={jobForm.summary}
                  onChange={(e) => setJobForm({ ...jobForm, summary: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết (HTML)</label>
                <textarea
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                  rows={6}
                  value={jobForm.content}
                  onChange={(e) => setJobForm({ ...jobForm, content: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh minh hoạ (URL)</label>
                <input
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                  value={jobForm.imageUrl}
                  onChange={(e) => setJobForm({ ...jobForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức</label>
                  <select
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={jobForm.workType}
                    onChange={(e) => setJobForm({ ...jobForm, workType: e.target.value })}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={jobForm.position}
                    onChange={(e) => setJobForm({ ...jobForm, position: e.target.value })}
                    placeholder="VD: Data Analyst"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    placeholder="VD: Hà Nội"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mức lương</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={jobForm.salary}
                    onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                    placeholder="VD: 8-15 triệu VNĐ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp hồ sơ</label>
                  <input
                    type="date"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={jobForm.applicationDeadline}
                    onChange={(e) => setJobForm({ ...jobForm, applicationDeadline: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link ứng tuyển</label>
                <input
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                  value={jobForm.applicationLink}
                  onChange={(e) => setJobForm({ ...jobForm, applicationLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Xuất bản:</label>
                <button
                  type="button"
                  onClick={() => setJobForm({ ...jobForm, published: !jobForm.published })}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${jobForm.published ? "bg-green-500/10 text-green-400" : "bg-gray-100 text-gray-500"}`}
                >
                  {jobForm.published ? "Đã xuất bản" : "Nháp"}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowJobForm(false)} className="px-5 py-2 rounded-lg border text-gray-500 hover:bg-gray-100 transition">Hủy</button>
              <button onClick={handleSaveJob} className="px-5 py-2 rounded-lg bg-green-600 text-gray-900 font-medium hover:bg-green-700 transition shadow">
                {editingJob ? "Cập nhật" : "Tạo việc làm"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Expert Form Modal */}
      {showExpertForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                {editingExpert ? "Sửa chuyên gia" : "Thêm chuyên gia mới"}
              </h2>
              <button onClick={() => setShowExpertForm(false)} className="text-gray-600 hover:text-gray-500 text-2xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên *</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={expertForm.name}
                    onChange={(e) => setExpertForm({ ...expertForm, name: e.target.value })}
                    placeholder="VD: Cuong DN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí *</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={expertForm.position}
                    onChange={(e) => setExpertForm({ ...expertForm, position: e.target.value })}
                    placeholder="VD: Founder & Lead Instructor"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Công việc trước đây</label>
                <input
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                  value={expertForm.previousWork}
                  onChange={(e) => setExpertForm({ ...expertForm, previousWork: e.target.value })}
                  placeholder="VD: Data Analyst @ FPT Software"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={expertForm.avatarUrl}
                    onChange={(e) => setExpertForm({ ...expertForm, avatarUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                  <input
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={expertForm.linkedin}
                    onChange={(e) => setExpertForm({ ...expertForm, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                    value={expertForm.order}
                    onChange={(e) => setExpertForm({ ...expertForm, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Hiển thị:</label>
                    <button
                      type="button"
                      onClick={() => setExpertForm({ ...expertForm, published: !expertForm.published })}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${expertForm.published ? "bg-green-500/10 text-green-400" : "bg-gray-100 text-gray-500"}`}
                    >
                      {expertForm.published ? "Hiển thị" : "Ẩn"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button onClick={() => setShowExpertForm(false)} className="px-5 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition">Hủy</button>
              <button onClick={handleSaveExpert} className="px-5 py-2 rounded-lg bg-green-600 text-gray-900 font-medium hover:bg-green-700 transition shadow">
                {editingExpert ? "Cập nhật" : "Thêm chuyên gia"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center pt-10 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">{editingUser ? "Sửa người dùng" : "Thêm người dùng mới"}</h2>
              <button onClick={() => setShowUserForm(false)} className="text-gray-600 hover:text-gray-500 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị *</label><input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="VD: Nguyễn Văn A" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Username *</label><input className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} placeholder="VD: nguyenvana" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu {editingUser ? "(bỏ trống nếu không đổi)" : "*"}</label><input type="password" className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder={editingUser ? "Để trống giữ mật khẩu cũ" : "Nhập mật khẩu mới"} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Vai trò *</label><select className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}><option value="system_admin">Quản trị hệ thống</option><option value="content_manager">Quản lý nội dung</option><option value="sales_executive">Kinh doanh</option><option value="teaching_assistant">Trợ giảng</option></select></div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t"><button onClick={() => setShowUserForm(false)} className="px-5 py-2 rounded-lg border text-gray-500 hover:bg-gray-100 transition">Hủy</button><button onClick={handleSaveUser} className="px-5 py-2 rounded-lg bg-green-600 text-gray-900 font-medium hover:bg-green-700 transition shadow">{editingUser ? "Cập nhật" : "Tạo người dùng"}</button></div>
          </div>
        </div>
      )}

    </div>
  );
}
