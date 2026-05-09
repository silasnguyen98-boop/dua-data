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
  participantEmail?: string;
  participantDisplayName?: string;
  elapsedSeconds?: number;
}

export interface QuizLeaderboardEntry {
  id: string;
  participantName: string;
  participantEmail?: string;
  participantDisplayName?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  elapsedSeconds: number;
  submittedAt: string;
  submittedByTimeout: boolean;
  rank?: number;
}

export interface QuizAttemptAdminEntry extends QuizLeaderboardEntry {
  quizId: string;
  quizTitle: string;
  quizCategory?: string;
  quizDifficulty?: "easy" | "medium" | "hard";
  quizPublished?: boolean;
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
