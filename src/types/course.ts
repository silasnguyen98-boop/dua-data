export interface CurriculumItem {
  phase: string;
  title: string;
  lessons: number;
  topics?: string[];
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
  schedule: string;
  hours: string;
  category: string;
  curriculum: CurriculumItem[];
  outcomes: string[];
  targetAudience: string[];
  published?: boolean;
  comingSoon?: boolean;
}
