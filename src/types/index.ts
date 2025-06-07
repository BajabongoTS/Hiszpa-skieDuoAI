export type QuestionType = 'multiple-choice' | 'text-input' | 'matching' | 'flashcard';

export interface Question {
    type: QuestionType;
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    matchingPairs?: Array<{ spanish: string; polish: string }>;
<<<<<<< HEAD
    displayOrder?: {
        spanish: string[];
        polish: string[];
    };
=======
>>>>>>> parent of 8f63d10 (naprawienie błędu)
    flashcardData?: { spanish: string; polish: string };
}

export interface Lesson {
    id: number;
    title: string;
    description: string;
    progress: number;
    questions: Question[];
    vocabulary: Array<{ spanish: string; polish: string }>;
<<<<<<< HEAD
    lastCompleted?: Date;
    bestScore?: number;
    lastAttemptDate?: Date | null;
=======
>>>>>>> parent of 8f63d10 (naprawienie błędu)
}

export interface TestResult {
    lessonTitle: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAttempts: Record<string, number>;
    timeSpent: number;
    completedAt: Date;
} 