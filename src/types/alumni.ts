export interface Alumni {
  id: string;
  name: string;
  job: string;
  linkedin?: string;
  imageUrl?: string;
  coverImage?: string;
  content: string;
  order?: number;
  published?: boolean;
  createdAt: string;
  updatedAt: string;
}