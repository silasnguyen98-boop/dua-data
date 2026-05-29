import { Course, CurriculumItem } from "@/types/course";

type Row = Record<string, unknown>;

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (Array.isArray(value)) return value as T;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function getValue(row: Row, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }
  return undefined;
}

function getString(row: Row, keys: string[], fallback = ""): string {
  const value = getValue(row, keys);
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function getNumber(row: Row, keys: string[], fallback = 0): number {
  const value = getValue(row, keys);
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function getBoolean(row: Row, keys: string[], fallback = false): boolean {
  const value = getValue(row, keys);
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  if (typeof value === "number") return value !== 0;
  return fallback;
}

function getNullableDateString(row: Row, keys: string[]): string | null {
  const value = getValue(row, keys);
  if (value instanceof Date) return value.toISOString();

  const text = getString(row, keys).trim();
  if (!text) return null;

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toStringArray(value: unknown): string[] {
  const parsed = parseJsonValue<unknown[]>(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is string => typeof item === "string");
}

function toCurriculumItems(value: unknown): CurriculumItem[] {
  const parsed = parseJsonValue<unknown[]>(value, []);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item): CurriculumItem | null => {
      if (!item || typeof item !== "object") return null;
      const curriculum = item as Row;
      return {
        phase: getString(curriculum, ["phase"], ""),
        title: getString(curriculum, ["title"], ""),
        lessons: getNumber(curriculum, ["lessons"], 0),
        topics: toStringArray(getValue(curriculum, ["topics"])),
      };
    })
    .filter((item): item is CurriculumItem => Boolean(item));
}

function curriculumItemsToRows(courseId: string, curriculum: CurriculumItem[]) {
  const now = new Date().toISOString();
  return curriculum.map((item, index) => ({
    course_id: courseId,
    phase: item.phase || "",
    title: item.title || "",
    lessons: Number(item.lessons) || 0,
    topics: JSON.stringify(Array.isArray(item.topics) ? item.topics : []),
    sort_order: index + 1,
    created_at: now,
    updated_at: now,
  }));
}

export function normalizeCurriculumRow(row: Row): CurriculumItem {
  return {
    phase: getString(row, ["phase"]),
    title: getString(row, ["title"]),
    lessons: getNumber(row, ["lessons"]),
    topics: toStringArray(getValue(row, ["topics"])),
  };
}

export function normalizeCourseRow(row: Row, curriculum: CurriculumItem[] = []): Course {
  return {
    id: getString(row, ["id"]),
    slug: getString(row, ["slug"]),
    title: getString(row, ["title"]),
    shortDescription: getString(row, ["short_description", "shortDescription"]),
    description: getString(row, ["description"]),
    image: getString(row, ["image"]),
    imageUrl: getString(row, ["image_url", "imageUrl"], "") || undefined,
    instructor: getString(row, ["instructor"], "Đội Ngũ DUA Edu"),
    price: getNumber(row, ["price"]),
    originalPrice: getNumber(row, ["original_price", "originalPrice"]),
    discount: getNumber(row, ["discount"]),
    totalLessons: getNumber(row, ["total_lessons", "totalLessons"]),
    students: getNumber(row, ["students"]),
    rating: getNumber(row, ["rating"]),
    reviews: getNumber(row, ["reviews"]),
    startDate: getString(row, ["start_date", "startDate"]),
    endDate: getString(row, ["end_date", "endDate"], "") || undefined,
    registrationDeadline: getString(row, ["registration_deadline", "registrationDeadline"], "") || undefined,
    schedule: getString(row, ["schedule"]),
    hours: getString(row, ["hours"]),
    category: getString(row, ["category"]),
    courseType: getString(row, ["course_type", "courseType"], "online") as Course["courseType"],
    curriculum,
    outcomes: toStringArray(getValue(row, ["outcomes"])),
    targetAudience: toStringArray(getValue(row, ["target_audience", "targetAudience"])),
    published: getBoolean(row, ["published"]),
    comingSoon: getBoolean(row, ["coming_soon", "comingSoon"]),
    isHidden: getBoolean(row, ["is_hidden", "isHidden"]),
    hidePrice: getBoolean(row, ["hide_price", "hidePrice"]),
    createdAt: getString(row, ["created_at", "createdAt"], "") || undefined,
    updatedAt: getString(row, ["updated_at", "updatedAt"], "") || undefined,
  };
}

export function normalizeCourseRows(rows: Row[], curriculumByCourseId: Map<string, CurriculumItem[]> = new Map()): Course[] {
  return rows.map((row) => normalizeCourseRow(row, curriculumByCourseId.get(getString(row, ["id"])) || []));
}

export function normalizeCurriculumRows(rows: Row[]): CurriculumItem[] {
  return rows.map((row) => normalizeCurriculumRow(row));
}

export function groupCurriculumByCourseId(rows: Row[]) {
  const grouped = new Map<string, CurriculumItem[]>();

  for (const row of rows) {
    const courseId = getString(row, ["course_id", "courseId"]);
    if (!courseId) continue;

    const items = grouped.get(courseId) || [];
    items.push(normalizeCurriculumRow(row));
    grouped.set(courseId, items);
  }

  return grouped;
}

export function buildCoursePayload(data: Row, includeTimestamps = true) {
  const now = new Date().toISOString();

  return {
    firebase_id: typeof data.firebaseId === "string" ? data.firebaseId : typeof data.firebase_id === "string" ? data.firebase_id : null,
    slug: getString(data, ["slug"]),
    title: getString(data, ["title"]),
    short_description: getString(data, ["shortDescription", "short_description"]),
    description: getString(data, ["description"]),
    image: getString(data, ["image"]),
    image_url: getString(data, ["imageUrl", "image_url"], "") || null,
    instructor: getString(data, ["instructor"], "Đội Ngũ DUA Edu"),
    price: getNumber(data, ["price"]),
    original_price: getNumber(data, ["originalPrice", "original_price"]),
    discount: getNumber(data, ["discount"]),
    hide_price: getBoolean(data, ["hidePrice", "hide_price"]),
    total_lessons: getNumber(data, ["totalLessons", "total_lessons"]),
    students: getNumber(data, ["students"]),
    rating: getNumber(data, ["rating"]),
    reviews: getNumber(data, ["reviews"]),
    start_date: getNullableDateString(data, ["startDate", "start_date"]),
    end_date: getNullableDateString(data, ["endDate", "end_date"]),
    registration_deadline: getNullableDateString(data, ["registrationDeadline", "registration_deadline"]),
    schedule: getString(data, ["schedule"]),
    hours: getString(data, ["hours"]),
    category: getString(data, ["category"]),
    course_type: getString(data, ["courseType", "course_type"], "online"),
    target_audience: JSON.stringify(Array.isArray(data.targetAudience)
      ? data.targetAudience
      : Array.isArray(data.target_audience)
        ? data.target_audience
        : []),
    outcomes: JSON.stringify(Array.isArray(data.outcomes) ? data.outcomes : []),
    published: getBoolean(data, ["published"]),
    is_hidden: getBoolean(data, ["isHidden", "is_hidden"]),
    coming_soon: getBoolean(data, ["comingSoon", "coming_soon"]),
    ...(includeTimestamps ? { created_at: getNullableDateString(data, ["createdAt", "created_at"]) || now, updated_at: now } : {}),
  };
}

export function buildCurriculumPayload(courseId: string, curriculum: CurriculumItem[]) {
  return curriculumItemsToRows(courseId, curriculum);
}
