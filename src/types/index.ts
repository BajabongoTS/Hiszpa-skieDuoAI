export type QuestionType = 'multiple-choice' | 'text-input' | 'matching';

export interface Question {
    type: QuestionType;
    question: string;
    correctAnswer: string;
    options?: string[];
    matchingPairs?: Array<{ spanish: string; polish: string }>;
    explanation?: string;
}

export interface Lesson {
    id: number;
    title: string;
    description: string;
    progress: number;
    questions: Question[];
    bestScore?: number;
    lastCompleted?: Date;
    lastAttemptDate?: Date | null;
}

export interface TestResult {
    lessonId: number;
    lessonTitle: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    timeSpent: number;
    completedAt: Date;
    incorrectAttempts: Record<string, number>;
} 