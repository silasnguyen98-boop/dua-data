"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Maximize2,
  Menu,
  Minimize2,
  PauseCircle,
  PlayCircle,
  X,
} from "lucide-react";
import type { Course, CurriculumItem, LearningResource, OnlineModule as CourseOnlineModule } from "@/types/course";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegistrationForm from "@/components/RegistrationForm";

interface Lesson {
  id: string;
  title: string;
  description: string;
  lessonType: "text" | "video";
  textContent: string;
  youtubeId: string;
  resources: LearningResource[];
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

type RegistrationSnapshot = {
  id: string;
  status: string;
  registeredAt: string;
};

const ELEARNING_COURSE_TYPES = new Set(["e_learning", "elearning"]);

function normalizeCourseType(value: unknown) {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "e-learning") return "e_learning";
  return raw || "e_learning";
}

function getCourseTypeLabel(value: unknown) {
  const courseType = normalizeCourseType(value);
  const labels: Record<string, string> = {
    e_learning: "E-learning",
    elearning: "E-learning",
  };
  return labels[courseType] || "E-learning";
}

function sortOnlineCourses(courses: OnlineCourse[]) {
  return [...courses]
    .filter((course) => course && course.published !== false && !course.isHidden && !course.comingSoon)
    .filter((course) => ELEARNING_COURSE_TYPES.has(normalizeCourseType(course.courseType)))
    .sort((a, b) => {
      const aTime = new Date(a.createdAt || a.startDate || "").getTime();
      const bTime = new Date(b.createdAt || b.startDate || "").getTime();
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });
}

function getCourseUrlKey(course: Pick<Course, "id" | "slug">) {
  return course.slug || course.id;
}

function isSameCourse(a: Pick<Course, "id" | "slug">, b: Pick<Course, "id" | "slug">) {
  return a.id === b.id || Boolean(a.slug && a.slug === b.slug);
}

function getVideoEmbedId(value: string) {
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

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let videoApiPromise: Promise<void> | null = null;

function loadVideoApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (videoApiPromise) return videoApiPromise;

  videoApiPromise = new Promise<void>((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return videoApiPromise;
}

function formatVideoTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function formatCoursePrice(value: number) {
  if (!value) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function LessonVideoPlayer({ videoId, title, onEnded, autoPlay = false }: { videoId: string; title: string; onEnded?: () => void; autoPlay?: boolean }) {
  const containerId = useMemo(() => `lesson-video-${videoId}-${Math.random().toString(36).slice(2)}`, [videoId]);
  const videoShellRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const endedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;

loadVideoApi().then(() => {
      if (cancelled || !window.YT?.Player) return;

      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            if (cancelled) return;
            setReady(true);
            setDuration(Number(event.target.getDuration?.() || 0));
            if (autoPlay) {
              event.target.playVideo?.();
              setHasStarted(true);
              setPlaying(true);
            }
          },
          onStateChange: (event: any) => {
            setPlaying(event.data === window.YT?.PlayerState?.PLAYING);
            setDuration(Number(event.target.getDuration?.() || 0));
            if (event.data === window.YT?.PlayerState?.PLAYING) {
              endedRef.current = false;
              setHasStarted(true);
            }
            if (event.data === window.YT?.PlayerState?.ENDED && !endedRef.current) {
              endedRef.current = true;
              onEnded?.();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [containerId, onEnded, videoId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player?.getCurrentTime) return;
      setCurrentTime(Number(player.getCurrentTime() || 0));
      setDuration(Number(player.getDuration?.() || 0));
    }, 500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function syncFullscreenState() {
      setFullscreen(document.fullscreenElement === videoShellRef.current);
    }

    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  function togglePlay() {
    const player = playerRef.current;
    if (!player || !ready) return;
    if (playing) {
      player.pauseVideo?.();
      setPlaying(false);
    } else {
      player.playVideo?.();
      setHasStarted(true);
      setPlaying(true);
    }
  }

  function seek(value: number) {
    const player = playerRef.current;
    if (!player || !ready) return;
    player.seekTo?.(value, true);
    setCurrentTime(value);
  }

  async function toggleFullscreen() {
    const shell = videoShellRef.current;
    if (!shell) return;

    try {
      if (document.fullscreenElement === shell) {
        await document.exitFullscreen?.();
      } else {
        await shell.requestFullscreen?.();
      }
    } catch {}
  }

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const showStartOverlay = !ready || !hasStarted;

  return (
    <div
      ref={videoShellRef}
      onContextMenu={(event) => event.preventDefault()}
      className={"relative w-full overflow-hidden bg-slate-950 " + (fullscreen ? "h-screen" : "aspect-video")}
    >
      <div
        className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
      >
        <div id={containerId} title={title} className="h-full w-full" />
      </div>


      {showStartOverlay && (
        <button
          type="button"
          onClick={togglePlay}
          disabled={!ready}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950 text-white transition focus:outline-none disabled:cursor-wait"
          aria-label="Phát video"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(22,163,74,0.22),transparent_55%)]" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-600 shadow-2xl shadow-green-950/30 transition hover:scale-105 hover:bg-green-500">
            <PlayCircle className="h-11 w-11" />
          </span>
          <span className="relative mt-5 max-w-[80%] truncate text-sm font-black text-slate-100">
            {ready ? title : "Đang tải video..."}
          </span>
        </button>
      )}

      {!showStartOverlay && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 z-10 flex items-center justify-center text-white focus:outline-none"
          aria-label={playing ? "Tạm dừng" : "Phát tiếp"}
        >
          {!playing && (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950/65 shadow-2xl backdrop-blur-sm transition hover:scale-105 hover:bg-green-600 sm:h-20 sm:w-20">
              <PlayCircle className="h-9 w-9 sm:h-11 sm:w-11" />
            </span>
          )}
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent px-4 pb-4 pt-10">
        <div className="flex items-center gap-3 text-white">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!ready}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-green-600 disabled:opacity-50"
            aria-label={playing ? "Tạm dừng" : "Phát"}
          >
            {playing ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
          </button>
          <span className="w-12 text-xs font-bold tabular-nums text-slate-200">{formatVideoTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || currentTime)}
            onChange={(event) => seek(Number(event.target.value))}
            disabled={!ready || duration <= 0}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-700 accent-green-500 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: `linear-gradient(to right, #16a34a ${progress}%, rgba(51,65,85,.95) ${progress}%)`,
            }}
            aria-label="Thanh thời gian video"
          />
          <span className="w-12 text-right text-xs font-bold tabular-nums text-slate-200">{formatVideoTime(duration)}</span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-green-600"
            aria-label={fullscreen ? "Thoát toàn màn hình" : "Mở toàn màn hình"}
          >
            {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
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
            lessonType: lesson.lessonType || (lesson.youtubeId ? "video" : "text"),
            textContent: lesson.textContent || "",
            youtubeId: lesson.youtubeId || "",
            resources: Array.isArray(lesson.resources) ? lesson.resources : [],
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
            lessonType: "text",
            textContent: "",
            youtubeId: "",
            resources: [],
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
        lessonType: "text",
        textContent: "",
        youtubeId: "",
        resources: [],
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
  const isLearningMode = searchParams.get("mode") === "learn" || Boolean(selectedLessonId);
  const shouldAutoOpenRegister = searchParams.get("register") === "1";

  const [courses, setCourses] = useState<OnlineCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasCourseAccess, setHasCourseAccess] = useState(false);
  const [registration, setRegistration] = useState<RegistrationSnapshot | null>(null);
  const [registrationLoaded, setRegistrationLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [autoAdvance, setAutoAdvance] = useState<{ lessonId: string; nextLessonId: string; seconds: number } | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      setLoading(true);
      setError("");
      setHasCourseAccess(false);
      setRegistration(null);
      setRegistrationLoaded(false);

      try {
        const res = await fetch("/api/courses", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || "Không thể tải khóa học e-learning");
        }

        const publicCourses = Array.isArray(data) ? sortOnlineCourses(data) : [];
        setCourses(publicCourses);

        if (selectedCourseId) {
          fetch(`/api/online/registration?courseId=${encodeURIComponent(selectedCourseId)}`, { cache: "no-store", signal: controller.signal })
            .then((statusRes) => statusRes.ok ? statusRes.json() : null)
            .then((statusData) => {
              setRegistration(statusData?.registration || null);
              setRegistrationLoaded(true);
              setIsAuthenticated(Boolean(statusData?.authenticated));
              if (statusData?.canLearn) setHasCourseAccess(true);
            })
            .catch(() => setRegistrationLoaded(true));

          fetch("/api/online/courses", { cache: "no-store", signal: controller.signal })
            .then((accessRes) => accessRes.ok ? accessRes.json() : [])
            .then((accessData) => {
              if (!Array.isArray(accessData)) return;
              setHasCourseAccess(accessData.some((course) => course.id === selectedCourseId || course.slug === selectedCourseId));
              setCourses((currentCourses) =>
                currentCourses.map((course) => {
                  const accessCourse = accessData.find((item) => isSameCourse(course, item));
                  return accessCourse
                    ? {
                        ...course,
                        ...accessCourse,
                        onlineModules: accessCourse.onlineModules || course.onlineModules,
                      }
                    : course;
                }),
              );
            })
            .catch(() => {});
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Không thể tải khóa học e-learning");
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
    return () => controller.abort();
  }, [selectedCourseId]);

  const selectedCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    return courses.find((course) => course.id === selectedCourseId || course.slug === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  const modules = useMemo(() => selectedCourse ? buildModules(selectedCourse) : [], [selectedCourse]);
  const allLessons = useMemo(() => modules.flatMap((mod) => mod.lessons), [modules]);
  const isLessonUnlocked = useCallback((lesson: Lesson | null) => {
    if (!lesson) return false;
    return hasCourseAccess || Boolean(lesson.isPreview);
  }, [hasCourseAccess]);

  const activeLesson = useMemo(() => {
    return allLessons.find((lesson) => lesson.id === selectedLessonId) || allLessons.find((lesson) => isLessonUnlocked(lesson)) || allLessons[0] || null;
  }, [allLessons, isLessonUnlocked, selectedLessonId]);

  useEffect(() => {
    if (modules[0]) {
      setExpandedModules((prev) => ({ ...prev, [modules[0].id]: true }));
    }
  }, [modules]);

  useEffect(() => {
    if (!shouldAutoOpenRegister || !selectedCourse || registration || hasCourseAccess) return;
    setShowRegistrationForm(true);
  }, [hasCourseAccess, registration, selectedCourse, shouldAutoOpenRegister]);

  function openCourse(course: Course) {
    router.push(`/elearning?course=${getCourseUrlKey(course)}`);
  }

  function startLearning() {
    if (!selectedCourse) return;
    if (!hasCourseAccess) {
      if (!registration) setShowRegistrationForm(true);
      return;
    }
    const firstLesson = allLessons.find((lesson) => isLessonUnlocked(lesson)) || allLessons[0];
    const params = new URLSearchParams({ course: getCourseUrlKey(selectedCourse), mode: "learn" });
    if (firstLesson) params.set("lesson", firstLesson.id);
    router.push(`/elearning?${params.toString()}`);
  }

  function selectLesson(lesson: Lesson) {
    if (!selectedCourse) return;
    if (!isLessonUnlocked(lesson)) return;
    router.push(`/elearning?course=${getCourseUrlKey(selectedCourse)}&mode=learn&lesson=${lesson.id}`, { scroll: false });
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }

  function findNextUnlockedLesson(lessonId: string) {
    const currentIndex = allLessons.findIndex((lesson) => lesson.id === lessonId);
    if (currentIndex < 0) return null;
    return allLessons.slice(currentIndex + 1).find((lesson) => isLessonUnlocked(lesson)) || null;
  }

  function setLessonCompletedState(lessonId: string, completed: boolean) {
    setCourses((prevCourses) =>
      prevCourses.map((course) => ({
        ...course,
        onlineModules: course.onlineModules?.map((mod) => ({
          ...mod,
          lessons: mod.lessons.map((lesson) =>
            lesson.id === lessonId ? { ...lesson, isCompleted: completed } : lesson,
          ),
        })),
      })),
    );
  }

  async function saveLessonCompletion(lessonId: string, completed: boolean) {
    const res = await fetch("/api/online/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, completed }),
    });

    return res.ok;
  }

  async function markLessonComplete(lesson: Lesson) {
    if (!canTrackProgress || lesson.isCompleted) return;
    setLessonCompletedState(lesson.id, true);
    const saved = await saveLessonCompletion(lesson.id, true);
    if (!saved) setLessonCompletedState(lesson.id, false);
  }

  async function toggleLessonComplete() {
    if (!activeLesson) return;
    const nextCompleted = !activeLesson.isCompleted;

    setLessonCompletedState(activeLesson.id, nextCompleted);

    const saved = await saveLessonCompletion(activeLesson.id, nextCompleted);

    if (!saved) setLessonCompletedState(activeLesson.id, !nextCompleted);
  }

  useEffect(() => {
    if (!autoAdvance || !selectedCourse) return;

    if (activeLesson?.id !== autoAdvance.lessonId) {
      setAutoAdvance(null);
      return;
    }

    if (autoAdvance.seconds <= 0) {
      const nextLesson = allLessons.find((lesson) => lesson.id === autoAdvance.nextLessonId);
      setAutoAdvance(null);
      if (nextLesson) selectLesson(nextLesson);
      return;
    }

    const timer = window.setTimeout(() => {
      setAutoAdvance((current) =>
        current && current.lessonId === autoAdvance.lessonId
          ? { ...current, seconds: current.seconds - 1 }
          : current,
      );
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [activeLesson?.id, allLessons, autoAdvance, selectedCourse]);

  if (loading) return <LoadingScreen />;

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

  if (selectedCourseId && !selectedCourse) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <Lock className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mb-3 text-2xl font-black text-slate-950">Khóa học chưa được mở quyền</h1>
          <p className="mb-7 text-sm font-medium leading-6 text-slate-500">
            Bạn cần đăng ký và được DUA Edu xác nhận là học viên trước khi vào lớp học e-learning.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/elearning" className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
              Xem khóa e-learning
            </Link>
            <Link href="/my-courses" className="inline-flex items-center justify-center rounded-full bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700">
              Khóa học của tôi
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!selectedCourse) {
    return (
      <div className="min-h-screen bg-white font-sans selection:bg-emerald-500 selection:text-white">
        <Navbar />
        <main>
          <section className="relative overflow-hidden px-6 pb-20 pt-32">
          <div className="absolute right-0 top-0 -z-10 h-[520px] w-[520px] rounded-full bg-emerald-50/70 blur-[110px]" />
          <div className="absolute bottom-0 left-0 -z-10 h-[300px] w-[300px] rounded-full bg-sky-50/70 blur-[90px]" />

          <div className="mx-auto flex max-w-7xl flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-5 text-[10px] font-black uppercase tracking-[0.3em] text-green-600">DUA Edu Online</p>
              <h1 className="text-5xl font-black leading-[1.08] tracking-tight text-slate-950 md:text-7xl">
                Học kỹ năng phân tích dữ liệu ngay trên <span className="text-emerald-500">DUA Edu</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg font-medium leading-relaxed text-slate-500">
                Đăng kí học ngay - bắt đầu nâng trình chuyên môn của bạn.
              </p>
            </div>

            <Link href="/my-courses" className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-black text-green-700 shadow-sm transition hover:bg-emerald-50">
              Khóa học của tôi
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 pb-32">
          {courses.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <BookOpen className="h-7 w-7 text-slate-400" />
              </div>
              <h2 className="mb-2 text-xl font-black text-slate-900">Chưa có khóa e-learning nào</h2>
              <p className="mx-auto max-w-md text-sm font-medium leading-6 text-slate-500">
                DUA Edu đang chuẩn bị thêm các lớp học e-learning mới. Bạn quay lại sau nhé.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, index) => (
                <article
                  key={course.id}
                  className="group flex min-h-[460px] flex-col overflow-hidden rounded-[40px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_100px_rgba(0,0,0,0.08)]"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                    {course.imageUrl ? (
                      <img src={course.imageUrl} alt={course.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-emerald-50 text-green-700">
                        <PlayCircle className="h-14 w-14" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full bg-green-500/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg backdrop-blur">
                      {getCourseTypeLabel(course.courseType)}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-7">
                    <h2 className="mb-4 line-clamp-2 text-lg font-black leading-tight tracking-tight text-slate-950 transition-colors group-hover:text-green-600">
                      {course.title}
                    </h2>
                    <p className="mb-7 line-clamp-3 text-sm font-medium leading-6 text-slate-500">
                      {course.shortDescription || "Sẵn sàng tiếp tục lộ trình học của bạn."}
                    </p>

                    <div className="mb-7 flex items-center gap-5 text-slate-400">
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-green-50">
                          <BookOpen className="h-3 w-3 text-green-500" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500">{course.totalLessons || 0} bài</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-green-50">
                          <FileText className="h-3 w-3 text-green-500" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500">{course.hours || "Online"}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      {!course.hidePrice && (course.originalPrice || 0) > (course.price || 0) && (
                        <div className="mb-0.5 text-[11px] font-bold text-slate-400 line-through">
                          {new Intl.NumberFormat("vi-VN").format(course.originalPrice)}đ
                        </div>
                      )}
                      <div className="text-lg font-black text-green-700">
                        {course.hidePrice
                          ? "Liên hệ tư vấn"
                          : !course.price
                          ? "Miễn phí"
                          : new Intl.NumberFormat("vi-VN").format(course.price) + "đ"}
                      </div>
                    </div>

                    <button
                      onClick={() => openCourse(course)}
                      className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-green-600"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Xem trước khóa học
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const totalLessons = modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
  const completedLessons = allLessons.filter((lesson) => lesson.isCompleted).length;
  const completionPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const activeLessonUnlocked = isLessonUnlocked(activeLesson);
  const activeLessonType = activeLesson?.lessonType || (activeLesson?.youtubeId ? "video" : "text");
  const activeVideoId = activeLessonUnlocked && activeLessonType === "video" ? getVideoEmbedId(activeLesson?.youtubeId || "") : "";
  const canTrackProgress = hasCourseAccess && Boolean(selectedCourse.onlineModules?.length);
  const classMaterials = Array.isArray(selectedCourse.classMaterials) ? selectedCourse.classMaterials : [];
  const lessonResources = Array.isArray(activeLesson?.resources) ? activeLesson.resources : [];
  const isPendingRegistration = Boolean(registration && !hasCourseAccess);
  const nextAutoLesson = autoAdvance ? allLessons.find((lesson) => lesson.id === autoAdvance.nextLessonId) || null : null;
  const selectedCoursePrice = Number(selectedCourse.price || 0);
  const selectedCourseOriginalPrice = Number(selectedCourse.originalPrice || 0);
  const showOriginalCoursePrice = !selectedCourse.hidePrice && selectedCourseOriginalPrice > selectedCoursePrice;

  function handleActiveVideoEnded() {
    if (!selectedCourse || !activeLesson || activeLessonType !== "video" || !activeLessonUnlocked) return;
    markLessonComplete(activeLesson);

    const nextLesson = findNextUnlockedLesson(activeLesson.id);
    if (nextLesson) {
      setAutoAdvance({ lessonId: activeLesson.id, nextLessonId: nextLesson.id, seconds: 3 });
    }
  }

  function renderPreviewAction() {
    if (!registrationLoaded) {
      return (
        <button disabled className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-200 px-5 py-4 text-sm font-black text-slate-500">
          Đang kiểm tra đăng ký...
        </button>
      );
    }

    if (hasCourseAccess) {
      return (
        <button
          onClick={startLearning}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 text-sm font-black text-white transition hover:bg-green-700"
        >
          <PlayCircle className="h-4 w-4" />
          Vào học ngay
        </button>
      );
    }

    if (isPendingRegistration) {
      return (
        <button disabled className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-amber-100 px-5 py-4 text-center text-sm font-black leading-6 text-amber-800">
          Đã đăng kí lớp học - kiểm tra email để xác nhận tham gia
        </button>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="mt-6 space-y-2">
          <button
            onClick={() => router.push(`/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 text-sm font-black text-white transition hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            Đăng nhập để vào học
          </button>
          <p className="text-center text-xs font-medium text-slate-500">
            Đã đăng ký rồi? Đăng nhập để hệ thống tự nhận diện. Chưa đăng ký?{" "}
            <button type="button" onClick={() => setShowRegistrationForm(true)} className="font-bold text-green-600 underline-offset-2 hover:underline">
              Đăng ký ngay
            </button>
          </p>
        </div>
      );
    }

    return (
      <button
        onClick={() => setShowRegistrationForm(true)}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-4 text-sm font-black text-white transition hover:bg-green-700"
      >
        <CheckCircle className="h-4 w-4" />
        Đăng ký ngay
      </button>
    );
  }

  function renderPreviewLessonModal() {
    if (!previewLesson) return null;

    const lessonType = previewLesson.lessonType || (previewLesson.youtubeId ? "video" : "text");
    const embedId = lessonType === "video" ? getVideoEmbedId(previewLesson.youtubeId || "") : "";
    const resources = [
      ...classMaterials,
      ...(Array.isArray(previewLesson.resources) ? previewLesson.resources : []),
    ];

    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        onClick={() => setPreviewLesson(null)}
      >
        <div
          className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-green-600">
                {lessonType === "video" ? "Video bài học" : "Bài giảng text"}
              </p>
              <h3 className="line-clamp-2 text-lg font-black text-slate-950">{previewLesson.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setPreviewLesson(null)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              aria-label="Đóng preview bài học"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[calc(92vh-74px)] overflow-y-auto">
            {lessonType === "video" && embedId ? (
              <LessonVideoPlayer videoId={embedId} title={previewLesson.title} />
            ) : lessonType === "text" ? (
              <div className="bg-slate-950 px-6 py-12 text-center text-white">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                  <FileText className="h-8 w-8 text-green-400" />
                </div>
                <h4 className="text-2xl font-black">{previewLesson.title}</h4>
              </div>
            ) : (
              <div className="bg-slate-950 px-6 py-12 text-center text-white">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                  <PlayCircle className="h-8 w-8 text-green-400" />
                </div>
                <h4 className="text-2xl font-black">{previewLesson.title}</h4>
                <p className="mt-3 text-sm font-medium text-slate-300">Bài học này chưa có nguồn video.</p>
              </div>
            )}

            <div className="space-y-5 p-6">
              {(previewLesson.description || previewLesson.textContent) && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h4 className="mb-2 text-sm font-black text-slate-900">Nội dung bài học</h4>
                  <p className="whitespace-pre-line text-sm font-medium leading-7 text-slate-600">
                    {previewLesson.textContent || previewLesson.description}
                  </p>
                </div>
              )}

              {resources.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-black text-slate-900">Tài liệu liên quan</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {resources.map((resource, index) => (
                      <a
                        key={resource.id || `${resource.url}-${index}`}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-green-200 hover:bg-green-50"
                      >
                        <p className="text-sm font-black text-slate-900">{resource.title}</p>
                        {resource.description && <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{resource.description}</p>}
                        <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-green-600">{resource.type || "link"}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLearningMode || !registrationLoaded || !hasCourseAccess) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500 selection:text-white">
        <Navbar />
        <main className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 pt-24 sm:px-6 sm:pb-24 sm:pt-28 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-8">
          <section className="space-y-6 sm:space-y-8">
            <button
              onClick={() => router.push("/elearning")}
              className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-green-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Tất cả khóa e-learning
            </button>

            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm sm:rounded-[36px]">
              <div className="relative aspect-[16/10] bg-slate-200 sm:aspect-[16/8]">
                {selectedCourse.imageUrl ? (
                  <img src={selectedCourse.imageUrl} alt={selectedCourse.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-950 text-green-400">
                    <PlayCircle className="h-20 w-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4">
                    <span className="rounded-full bg-green-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white sm:px-3 sm:py-1.5 sm:text-[10px]">
                      {getCourseTypeLabel(selectedCourse.courseType)}
                    </span>
                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-700 backdrop-blur sm:px-3 sm:py-1.5 sm:text-[10px]">
                      Xem trước
                    </span>
                  </div>
                  <h1 className="max-w-4xl text-[26px] font-black leading-[1.05] tracking-tight text-white sm:text-3xl md:text-5xl">{selectedCourse.title}</h1>
                </div>
              </div>

              <div className="p-4 sm:p-6 md:p-8">
                {selectedCourse.shortDescription && (
                  <p className="max-w-4xl text-base font-medium leading-7 text-slate-600">{selectedCourse.shortDescription}</p>
                )}
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-black text-slate-600 sm:mt-6 sm:gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-2 sm:px-4">{totalLessons} bài học</span>
                  <span className="rounded-full bg-slate-100 px-3 py-2 sm:px-4">{modules.length} phần</span>
                  <span className="rounded-full bg-slate-100 px-3 py-2 sm:px-4">{classMaterials.length} tài liệu</span>
                  {selectedCourse.hours && <span className="rounded-full bg-slate-100 px-3 py-2 sm:px-4">{selectedCourse.hours}</span>}
                </div>
              </div>
            </div>

            {(selectedCourse.description || selectedCourse.shortDescription) && (
              <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:p-8">
                <h2 className="mb-3 text-xl font-black text-slate-950">Thông tin khóa học</h2>
                <p className="whitespace-pre-line text-sm font-medium leading-7 text-slate-600">
                  {selectedCourse.description || selectedCourse.shortDescription}
                </p>
              </section>
            )}

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:p-8">
              <h2 className="mb-5 text-lg font-black text-slate-950 sm:text-xl">Nội dung khóa học</h2>
              <div className="space-y-3">
                {modules.map((mod) => (
                  <div key={mod.id} className="overflow-hidden rounded-xl border border-slate-200 sm:rounded-2xl">
                    <div className="flex items-start justify-between gap-3 bg-slate-50 px-3 py-3 sm:px-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-600">{mod.phase}</p>
                        <h3 className="text-sm font-black text-slate-900">{mod.title}</h3>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-500 sm:px-3">{mod.lessons.length} bài</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {mod.lessons.map((lesson) => {
                        const unlocked = isLessonUnlocked(lesson);
                        const lessonType = lesson.lessonType || (lesson.youtubeId ? "video" : "text");
                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => unlocked && setPreviewLesson(lesson)}
                            disabled={!unlocked}
                            className={`flex w-full items-start gap-2.5 px-3 py-3 text-left transition sm:gap-3 sm:px-4 ${
                              unlocked ? "hover:bg-green-50/70" : "cursor-not-allowed bg-slate-50/40"
                            }`}
                          >
                            <div className={`mt-0.5 ${unlocked ? "text-green-600" : "text-amber-500"}`}>
                              {unlocked ? (
                                lessonType === "video" ? <PlayCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />
                              ) : (
                                <Lock className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-bold leading-5 text-slate-800 sm:text-sm">{lesson.title}</p>
                              <p className="mt-1 text-xs font-medium text-slate-500">
                                {lessonType === "video" ? "Video bài học" : "Bài giảng text"}
                                {lesson.durationMinutes > 0 ? ` · ${lesson.durationMinutes} phút` : ""}
                              </p>
                            </div>
                            {unlocked ? (
                              <span className="rounded-full bg-green-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-green-700">
                                Xem
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-amber-700">
                                Khóa
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              {selectedCourse.imageUrl && (
                <img src={selectedCourse.imageUrl} alt="" className="aspect-video w-full object-cover" />
              )}
              <div className="p-6">
                <h2 className="mb-4 text-xl font-black text-slate-950">Khóa học này bao gồm</h2>
                <div className="space-y-3 text-sm font-medium text-slate-600">
                  <div className="flex items-center gap-3"><CheckCircle className="h-4 w-4 text-green-600" /> Học online trên nền tảng</div>
                  <div className="flex items-center gap-3"><BookOpen className="h-4 w-4 text-green-600" /> {modules.length} phần, {totalLessons} bài học</div>
                  <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-green-600" /> {classMaterials.length} tài liệu lớp học</div>
                  <div className="flex items-center gap-3"><PlayCircle className="h-4 w-4 text-green-600" /> Video và bài giảng text</div>
                </div>
                <div className="mt-5 rounded-2xl border border-green-100 bg-green-50/70 p-4">
                  {showOriginalCoursePrice && (
                    <div className="mb-1 text-sm font-bold text-slate-400 line-through">
                      {formatCoursePrice(selectedCourseOriginalPrice)}
                    </div>
                  )}
                  <div className="text-2xl font-black text-green-700">
                    {selectedCourse.hidePrice ? "Liên hệ tư vấn" : formatCoursePrice(selectedCoursePrice)}
                  </div>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-green-700/70">Giá sau khuyến mãi</p>
                </div>
                {isPendingRegistration && (
                  <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-800">
                    Bạn đã đăng kí lớp học, vui lòng kiểm tra email để xác nhận tham gia.
                  </div>
                )}
                {renderPreviewAction()}
              </div>
            </div>
          </aside>
        </main>
        {renderPreviewLessonModal()}
        {showRegistrationForm && selectedCourse && (
          <RegistrationForm
            courseId={selectedCourse.id}
            courseTitle={selectedCourse.title}
            coursePath={`/elearning?course=${getCourseUrlKey(selectedCourse)}`}
            onClose={() => setShowRegistrationForm(false)}
            onSuccess={(nextRegistration) => {
              setRegistration({
                id: "",
                status: nextRegistration?.status || "new",
                registeredAt: new Date().toISOString(),
              });
              setRegistrationLoaded(true);
              router.replace(`/elearning?course=${getCourseUrlKey(selectedCourse)}`, { scroll: false });
            }}
          />
        )}
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-slate-950 px-4 text-white lg:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <button onClick={() => router.push("/elearning")} className="text-slate-400 transition hover:text-white">
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
          <section className={`relative w-full bg-black text-white ${activeLessonType === "video" ? "aspect-video" : "min-h-[360px]"}`}>
            {!activeLessonUnlocked ? (
              <div className="flex min-h-[360px] w-full items-center justify-center bg-slate-950">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.16),transparent_55%)]" />
                <div className="relative z-10 max-w-xl px-6 py-16 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur">
                    <Lock className="h-8 w-8 text-amber-300" />
                  </div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">Bài học đang khóa</p>
                  <h2 className="text-2xl font-black tracking-tight md:text-4xl">{activeLesson?.title || selectedCourse.title}</h2>
                  <p className="mt-4 text-sm font-medium leading-6 text-slate-300">
                    Bài này thuộc nội dung trả phí. Bạn vẫn có thể xem thông tin khóa và các bài preview đang mở.
                  </p>
                </div>
              </div>
            ) : activeLessonType === "video" && activeVideoId ? (
              <LessonVideoPlayer videoId={activeVideoId} title={activeLesson?.title || selectedCourse.title} onEnded={handleActiveVideoEnded} autoPlay />
            ) : activeLessonType === "text" ? (
              <div className="flex min-h-[360px] w-full items-center justify-center bg-slate-950">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.16),transparent_55%)]" />
                <div className="relative z-10 max-w-3xl px-6 py-16 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur">
                    <FileText className="h-9 w-9 text-green-400" />
                  </div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-green-400">Bài giảng text</p>
                  <h2 className="text-2xl font-black tracking-tight md:text-4xl">{activeLesson?.title || selectedCourse.title}</h2>
                  <p className="mt-4 text-sm font-medium leading-6 text-slate-300">
                    Đọc nội dung bài học bên dưới và đánh dấu hoàn thành khi đã nắm được phần này.
                  </p>
                </div>
              </div>
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
                    Thêm nguồn video cho bài học này trong admin để nội dung hiển thị tại đây.
                  </p>
                </div>
              </div>
            )}
            {autoAdvance && nextAutoLesson && activeLesson?.id === autoAdvance.lessonId && (
              <div className="absolute bottom-20 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-green-400/20 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-widest text-green-300">Đã hoàn thành bài học</p>
                    <p className="mt-1 truncate text-sm font-bold text-white">
                      Chuyển sang bài tiếp theo sau {autoAdvance.seconds}s
                    </p>
                  </div>
                </div>
              </div>
            )}
            {activeLesson?.isCompleted && !autoAdvance && (
              <div className="absolute right-5 top-5 z-30 inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-2xl shadow-green-950/20">
                <CheckCircle className="h-4 w-4" />
                Đã hoàn thành
              </div>
            )}
          </section>

          <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
            <div className="mb-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <h2 className="text-2xl font-black text-slate-900">{activeLesson?.title || "Bài học"}</h2>
                    {activeLesson?.isCompleted && (
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600" title="Đã học xong">
                        <CheckCircle className="h-5 w-5" />
                      </span>
                    )}
                  </div>
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

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-base font-black text-slate-900">Nội dung bài học</h3>
              {!activeLessonUnlocked ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <div className="mb-2 flex items-center gap-2 text-amber-700">
                    <Lock className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Nội dung bị khóa</span>
                  </div>
                  <p className="text-sm font-medium leading-6 text-amber-800">
                    Bài học này sẽ mở sau khi bạn đăng ký và được xác nhận quyền học e-learning.
                  </p>
                </div>
              ) : activeLessonType === "text" && activeLesson?.textContent ? (
                <div className="whitespace-pre-line text-sm font-medium leading-7 text-slate-600">
                  {activeLesson.textContent}
                </div>
              ) : (
                <p className="text-sm font-medium leading-7 text-slate-600">
                  {activeLesson?.description || "Đây là lớp học e-learning cho khóa đã được mở quyền. Bạn có thể điều hướng các bài học ở sidebar bên phải."}
                </p>
              )}
            </div>

            {(classMaterials.length > 0 || lessonResources.length > 0) && (
              <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-base font-black text-slate-900">Tài liệu lớp học</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {[...classMaterials, ...lessonResources].map((resource, index) => (
                    <a
                      key={resource.id || `${resource.url}-${index}`}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-green-200 hover:bg-green-50"
                    >
                      <p className="text-sm font-black text-slate-900">{resource.title}</p>
                      {resource.description && <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{resource.description}</p>}
                      <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-green-600">{resource.type || "link"}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>

        <aside className={`absolute right-0 top-0 z-40 flex h-full w-full flex-col border-l border-slate-200 bg-white transition-transform duration-300 sm:w-[400px] lg:relative lg:w-[380px] lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4">
            <div>
              <h3 className="font-black text-slate-900">Nội dung khóa học</h3>
              <p className="text-xs font-bold text-slate-400">{completedLessons}/{totalLessons} bài đã hoàn thành</p>
            </div>
            <button className="text-slate-500 lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="border-b border-slate-100 bg-white px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Tiến độ học</span>
              <span className="text-green-600">{completionPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${completionPercent}%` }} />
            </div>
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
                      const unlocked = isLessonUnlocked(lesson);
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => selectLesson(lesson)}
                          disabled={!unlocked}
                          className={`flex w-full items-start gap-3 px-5 py-3 transition ${
                            isActive ? "bg-green-50/60" : unlocked ? "hover:bg-slate-50" : "cursor-not-allowed bg-slate-50/40 opacity-75"
                          }`}
                        >
                          <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            lesson.isCompleted
                              ? "bg-green-500 text-white"
                              : unlocked
                                ? "bg-slate-100 text-slate-300"
                                : "bg-amber-50 text-amber-500"
                          }`}>
                            {!unlocked ? (
                              <Lock className="h-4 w-4" />
                            ) : lesson.isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="mb-1 flex items-start justify-between gap-3">
                              <p className={`flex min-w-0 items-start gap-2 text-sm ${isActive ? "font-bold text-green-700" : unlocked ? "text-slate-700" : "text-slate-400"}`}>
                                <span className="min-w-0">{lesson.title}</span>
                              </p>
                              {lesson.isCompleted ? (
                                <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-green-700">
                                  Xong
                                </span>
                              ) : !unlocked && (
                                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-700">
                                  Khóa
                                </span>
                              )}
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${unlocked ? "text-slate-500" : "text-slate-400"}`}>
                              {(lesson.lessonType || (lesson.youtubeId ? "video" : "text")) === "video" ? (
                                <PlayCircle className="h-3 w-3" />
                              ) : (
                                <FileText className="h-3 w-3" />
                              )}
                              <span>
                                {(lesson.lessonType || (lesson.youtubeId ? "video" : "text")) === "video"
                                  ? lesson.durationMinutes > 0 ? `${lesson.durationMinutes} phút` : "Video"
                                  : "Text"}
                              </span>
                              {lesson.isPreview && !hasCourseAccess && (
                                <span className="rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-green-700">
                                  Preview
                                </span>
                              )}
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
