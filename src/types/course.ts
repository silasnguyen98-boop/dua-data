export interface CurriculumItem {
  phase: string;
  title: string;
  lessons: number;
  topics?: string[];
}

export interface OnlineLesson {
  id?: string;
  title: string;
  description?: string;
  lessonType?: "text" | "video";
  textContent?: string;
  youtubeId?: string;
  resources?: LearningResource[];
  durationMinutes?: number;
  isPreview?: boolean;
  isCompleted?: boolean;
  orderIndex?: number;
}

export interface OnlineModule {
  id?: string;
  title: string;
  description?: string;
  orderIndex?: number;
  lessons: OnlineLesson[];
}

export interface WaitListEntry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  registeredAt: string;
  status: "pending" | "contacted" | "converted";
}

export interface LearningResource {
  id?: string;
  title: string;
  description?: string;
  url: string;
  type?: "document" | "spreadsheet" | "slide" | "dataset" | "link" | "other";
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  image: string;
  imageUrl?: string;
  instructor: string;
  price: number;
  originalPrice: number;
  discount: number;
  totalLessons: number;
  students: number;
  rating: number;
  reviews: number;
  startDate: string;
  endDate?: string;
  registrationDeadline?: string;
  schedule: string;
  hours: string;
  category: string;
  courseType?: "offline" | "online" | "e_learning" | "self_study" | "video" | "";
  curriculum: CurriculumItem[];
  classMaterials?: LearningResource[];
  onlineModules?: OnlineModule[];
  outcomes: string[];
  targetAudience: string[];
  published?: boolean;
  comingSoon?: boolean;
  isHidden?: boolean;
  hidePrice?: boolean;
  waitList?: WaitListEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = "system_admin" | "content_manager" | "sales_executive" | "teaching_assistant";

export interface AdminUser {
  username: string;
  role: UserRole;
  name: string;
}
