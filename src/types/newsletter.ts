export interface NewsletterContentItem {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  category?: string;
  createdAt?: string;
}

export interface NewsletterContent {
  resources: NewsletterContentItem[];
  jobs: NewsletterContentItem[];
  courses: NewsletterContentItem[];
}

export interface NewsletterRecipient {
  id?: string;
  userId: string;
  email: string;
  fullName: string;
  selected: boolean;
  wantsResources: boolean;
  lastSentBatchKey?: string | null;
  lastSentAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewsletterSchedule {
  id?: number;
  enabled: boolean;
  dayOfWeek: number;
  hour: number;
  minute: number;
  timezone: string;
  createdAt?: string;
  updatedAt?: string;
}
