export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface QuizAttemptRecord {
  answers: Record<number, number>;
  submittedByTimeout: boolean;
  submittedAt: string;
  participantName?: string;
  elapsedSeconds?: number;
}

export interface QuizLeaderboardEntry {
  id: string;
  participantName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  elapsedSeconds: number;
  submittedAt: string;
  submittedByTimeout: boolean;
  rank?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
  password?: string;
  hasPassword?: boolean;
  durationMinutes?: number;
  questionCount?: number;
  questions: QuizQuestion[];
  published?: boolean;
  order?: number;
  createdAt: string;
  updatedAt: string;
}
