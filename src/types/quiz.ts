export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
  questions: QuizQuestion[];
  published?: boolean;
  order?: number;
  createdAt: string;
  updatedAt: string;
}
