export type QuestionType = 'multiple-choice' | 'text-input' | 'matching' | 'flashcard';

export interface Question {
    type: QuestionType;
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    matchingPairs?: Array<{ spanish: string; polish: string }>;
    flashcardData?: { spanish: string; polish: string };
}

export interface Lesson {
    id: number;
    title: string;
    description: string;
    progress: number;
    questions: Question[];
    vocabulary: Array<{ spanish: string; polish: string }>;
}

export interface TestResult {
    lessonTitle: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAttempts: Record<string, number>;
    timeSpent: number;
    completedAt: Date;
} 