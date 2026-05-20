"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
  Menu,
  PlayCircle,
  X,
} from "lucide-react";
import type { Course, CurriculumItem, OnlineModule as CourseOnlineModule } from "@/types/course";

interface Lesson {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  durationMinutes: number;
  isPreview?: boolean;
  isCompleted?: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  phase: string;
  orderIndex: number;
  lessons: Lesson[];
}

type OnlineCourse = Omit<Course, "onlineModules"> & {
  onlineModules?: CourseOnlineModule[];
};

function getYouTubeEmbedId(value: string) {
  const raw = value.trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (url.hostname.includes("youtu.be")) return url.pathname.replace("/", "");
    if (url.searchParams.get("v")) return url.searchParams.get("v") || "";
    const embedMatch = url.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch) return embedMatch[1] || "";
  } catch {}

  return raw;
}

function buildModules(course: OnlineCourse): Module[] {
  if (Array.isArray(course.onlineModules) && course.onlineModules.length > 0) {
    return course.onlineModules.map((mod, index) => ({
      id: mod.id || `${course.id}-online-module-${index + 1}`,
      title: mod.title,
      phase: `Phần ${index + 1}`,
      description: mod.description || "",
      orderIndex: mod.orderIndex || index,
      lessons: Array.isArray(mod.lessons)
        ? mod.lessons.map((lesson, lessonIndex) => ({
            id: lesson.id || `${course.id}-online-module-${index + 1}-lesson-${lessonIndex + 1}`,
            title: lesson.title,
            description: lesson.description || "",
            youtubeId: lesson.youtubeId || "",
            durationMinutes: Number(lesson.durationMinutes || 0),
            isPreview: Boolean(lesson.isPreview),
            isCompleted: Boolean(lesson.isCompleted),
          }))
        : [],
    }));
  }

  const curriculum = Array.isArray(course.curriculum) ? course.curriculum : [];

  if (curriculum.length === 0) {
    return [
      {
        id: `${course.id}-intro`,
        title: "Nội dung khóa học",
        description: "",
        phase: "Video",
        orderIndex: 0,
        lessons: [
          {
            id: `${course.id}-welcome`,
            title: "Bài học đầu tiên",
            description: "",
            youtubeId: "",
            durationMinutes: 0,
            isCompleted: false,
          },
        ],
      },
    ];
  }

  return curriculum.map((item: CurriculumItem, moduleIndex) => {
    const topics = Array.isArray(item.topics) && item.topics.length > 0
      ? item.topics
      : [`${item.lessons || 1} bài học`];

    return {
      id: `${course.id}-module-${moduleIndex + 1}`,
      title: item.title || `Chương ${moduleIndex + 1}`,
      description: "",
      phase: item.phase || `Phần ${moduleIndex + 1}`,
      orderIndex: moduleIndex,
      lessons: topics.map((topic, lessonIndex) => ({
        id: `${course.id}-m${moduleIndex + 1}-l${lessonIndex + 1}`,
        title: topic,
        description: "",
        youtubeId: "",
        durationMinutes: 0,
        isCompleted: false,
      })),
    };
  });
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-green-500" />
    </div>
  );
}

function OnlineCourseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCourseId = searchParams.get("course") || "";
  const selectedLessonId = searchParams.get("lesson") || "";

  const [courses, setCourses] = useState<OnlineCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loginUrl, setLoginUrl] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      setLoading(true);
      setError("");
      setLoginUrl("");

      try {
        const res = await fetch("/api/online/courses", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json().catch(() => null);

        if (res.status === 401) {
          setLoginUrl(data?.loginUrl || "/login?next=/online");
          setCourses([]);
          return;
        }

        if (!res.ok) {
          throw new Error(data?.error || "Không thể tải khóa học online");
        }

        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Không thể tải khóa học online");
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
    return () => controller.abort();
  }, []);

  const selectedCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    return courses.find((course) => course.id === selectedCourseId || course.slug === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  const modules = useMemo(() => selectedCourse ? buildModules(selectedCourse) : [], [selectedCourse]);
  const activeLesson = useMemo(() => {
    const lessons = modules.flatMap((mod) => mod.lessons);
    return lessons.find((lesson) => lesson.id === selectedLessonId) || lessons[0] || null;
  }, [modules, selectedLessonId]);

  useEffect(() => {
    if (modules[0]) {
      setExpandedModules((prev) => ({ ...prev, [modules[0].id]: true }));
    }
  }, [modules]);

  function openCourse(course: Course) {
    const firstModule = buildModules(course)[0];
    const firstLesson = firstModule?.lessons[0];
    const params = new URLSearchParams({ course: course.id });
    if (firstLesson) params.set("lesson", firstLesson.id);
    router.push(`/online?${params.toString()}`);
  }

  function selectLesson(lesson: Lesson) {
    if (!selectedCourse) return;
    router.push(`/online?course=${selectedCourse.id}&lesson=${lesson.id}`, { scroll: false });
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }

  async function toggleLessonComplete() {
    if (!activeLesson) return;
    const nextCompleted = !activeLesson.isCompleted;

    setCourses((prevCourses) =>
      prevCourses.map((course) => ({
        ...course,
        onlineModules: course.onlineModules?.map((mod) => ({
          ...mod,
          lessons: mod.lessons.map((lesson) =>
            lesson.id === activeLesson.id ? { ...lesson, isCompleted: nextCompleted } : lesson,
          ),
        })),
      })),
    );

    const res = await fetch("/api/online/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: activeLesson.id, completed: nextCompleted }),
    });

    if (!res.ok) {
      setCourses((prevCourses) =>
        prevCourses.map((course) => ({
          ...course,
          onlineModules: course.onlineModules?.map((mod) => ({
            ...mod,
            lessons: mod.lessons.map((lesson) =>
              lesson.id === activeLesson.id ? { ...lesson, isCompleted: !nextCompleted } : lesson,
            ),
          })),
        })),
      );
    }
  }

  if (loading) return <LoadingScreen />;

  if (loginUrl) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <Lock className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="mb-4 text-3xl font-black tracking-tight">Đăng nhập để học online</h1>
          <p className="mb-8 text-sm font-medium leading-6 text-slate-300">
            Sau khi đăng nhập, bạn sẽ thấy các khóa video đã được DUA Edu xác nhận nhập học.
          </p>
          <Link href={loginUrl} className="rounded-2xl bg-green-500 px-8 py-3 text-sm font-black text-white transition hover:bg-green-600">
            Đăng nhập
          </Link>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-black text-slate-900">Chưa tải được khóa học</h1>
          <p className="text-sm font-medium text-red-500">{error}</p>
        </div>
      </main>
    );
  }

  if (!selectedCourse) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-green-600">DUA Edu Online</p>
              <h1 className="text-4xl font-black tracking-tight text-slate-950">Khóa học của tôi</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Các khóa học online bạn đã đăng ký và được xác nhận là học viên sẽ xuất hiện tại đây.
              </p>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Về trang chủ
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <BookOpen className="h-7 w-7 text-slate-400" />
              </div>
              <h2 className="mb-2 text-xl font-black text-slate-900">Bạn chưa có khóa online nào</h2>
              <p className="mx-auto max-w-md text-sm font-medium leading-6 text-slate-500">
                Khi sale/admin chuyển đăng ký của bạn sang trạng thái học viên, khóa online sẽ tự xuất hiện ở đây.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <article key={course.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="aspect-video bg-slate-200">
                    {course.imageUrl ? (
                      <img src={course.imageUrl} alt={course.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <PlayCircle className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="mb-3 inline-flex rounded-full bg-green-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-green-700">
                      {course.courseType === "online" ? "Online live" : course.courseType === "e_learning" ? "E-learning" : "Video course"}
                    </div>
                    <h2 className="mb-3 line-clamp-2 text-lg font-black leading-tight text-slate-950">{course.title}</h2>
                    <p className="mb-6 line-clamp-2 text-sm font-medium leading-6 text-slate-500">
                      {course.shortDescription || "Sẵn sàng tiếp tục lộ trình học của bạn."}
                    </p>
                    <button
                      onClick={() => openCourse(course)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-green-600"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Vào học
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  const totalLessons = modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
  const activeYouTubeId = getYouTubeEmbedId(activeLesson?.youtubeId || "");
  const canTrackProgress = Boolean(selectedCourse.onlineModules?.length);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-slate-950 px-4 text-white lg:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <button onClick={() => router.push("/online")} className="text-slate-400 transition hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="hidden h-6 w-px bg-slate-700 md:block" />
          <h1 className="truncate text-sm font-bold md:text-base">{selectedCourse.title}</h1>
        </div>
        <button className="text-slate-300 hover:text-white lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        <main className="flex w-full flex-1 flex-col overflow-y-auto lg:w-auto">
          <section className="relative aspect-video w-full bg-black text-white">
            {activeYouTubeId ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${activeYouTubeId}?rel=0&modestbranding=1`}
                title={activeLesson?.title || selectedCourse.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.18),transparent_55%)]" />
                <div className="relative z-10 max-w-xl px-6 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur">
                    <PlayCircle className="h-9 w-9 text-green-400" />
                  </div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-green-400">Chưa có video</p>
                  <h2 className="text-2xl font-black tracking-tight md:text-4xl">{activeLesson?.title || selectedCourse.title}</h2>
                  <p className="mt-4 text-sm font-medium leading-6 text-slate-300">
                    Thêm `youtube_id` cho bài học này trong bảng `course_lessons` để video hiển thị tại đây.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
            <div className="mb-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="mb-2 text-2xl font-black text-slate-900">{activeLesson?.title || "Bài học"}</h2>
                  <p className="text-sm font-medium text-slate-500">{selectedCourse.title}</p>
                </div>
                {activeLesson && canTrackProgress && (
                  <button
                    onClick={toggleLessonComplete}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                      activeLesson.isCompleted
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : "bg-slate-950 text-white hover:bg-green-600"
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {activeLesson.isCompleted ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
                  </button>
                )}
              </div>
            </div>

            <div className="mb-8 flex gap-8 overflow-x-auto border-b border-slate-200">
              <button className="border-b-2 border-slate-900 pb-4 text-sm font-bold text-slate-900">Tổng quan</button>
              <button className="border-b-2 border-transparent pb-4 text-sm font-bold text-slate-500">Hỏi đáp</button>
              <button className="flex items-center gap-2 border-b-2 border-transparent pb-4 text-sm font-bold text-slate-500">
                <FileText className="h-4 w-4" />
                Tài liệu
              </button>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-base font-black text-slate-900">Nội dung bài học</h3>
              <p className="text-sm font-medium leading-7 text-slate-600">
                {activeLesson?.description || "Đây là phòng học online cho khóa đã được mở quyền. Bạn có thể điều hướng các bài học ở sidebar bên phải."}
              </p>
            </div>
          </section>
        </main>

        <aside className={`absolute right-0 top-0 z-40 flex h-full w-full flex-col border-l border-slate-200 bg-white transition-transform duration-300 sm:w-[400px] lg:relative lg:w-[380px] lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4">
            <div>
              <h3 className="font-black text-slate-900">Nội dung khóa học</h3>
              <p className="text-xs font-bold text-slate-400">{totalLessons} bài học</p>
            </div>
            <button className="text-slate-500 lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {modules.map((mod) => (
              <div key={mod.id} className="border-b border-slate-100 last:border-b-0">
                <button
                  onClick={() => setExpandedModules((prev) => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                  className="flex w-full items-center justify-between bg-slate-50/50 px-5 py-4 transition hover:bg-slate-50"
                >
                  <div className="pr-4 text-left">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-green-600">{mod.phase}</p>
                    <h4 className="text-sm font-bold text-slate-900">{mod.title}</h4>
                  </div>
                  <div className="text-slate-400">
                    {expandedModules[mod.id] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                {expandedModules[mod.id] && (
                  <div className="bg-white">
                    {mod.lessons.map((lesson) => {
                      const isActive = activeLesson?.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => selectLesson(lesson)}
                          className={`flex w-full items-start gap-3 px-5 py-3 transition ${isActive ? "bg-green-50/60" : "hover:bg-slate-50"}`}
                        >
                          <div className={`mt-0.5 shrink-0 ${lesson.isCompleted ? "text-green-500" : "text-slate-300"}`}>
                            {lesson.isCompleted ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-300" />}
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`mb-1 text-sm ${isActive ? "font-bold text-green-700" : "text-slate-700"}`}>{lesson.title}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <PlayCircle className="h-3 w-3" />
                              <span>{lesson.durationMinutes > 0 ? `${lesson.durationMinutes} phút` : "Video"}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function OnlineCoursePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <OnlineCourseContent />
    </Suspense>
  );
}
