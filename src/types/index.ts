export type QuestionType = 'multiple-choice' | 'text-input' | 'matching';

export interface Question {
    type: QuestionType;
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    matchingPairs?: Array<{ spanish: string; polish: string }>;
    displayOrder?: {
        spanish: string[];
        polish: string[];
    };
}

export interface Lesson {
    id: number;
    title: string;
    description: string;
    progress: number;
    questions: Question[];
    lastCompleted?: Date;
    bestScore?: number;
    lastAttemptDate?: Date | null;
}

export interface TestResult {
    lessonTitle: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAttempts: Record<string, number>;
    timeSpent: number;
    completedAt: Date;
} 