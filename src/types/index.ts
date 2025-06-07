export type QuestionType = 'multiple-choice' | 'text-input' | 'matching' | 'flashcard';

export interface VocabularyPair {
    spanish: string;
    polish: string;
}

export interface Question {
    type: QuestionType;
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    matchingPairs?: VocabularyPair[];
    flashcardData?: VocabularyPair;
    displayOrder?: number;
}

export interface Lesson {
    id: number;
    title: string;
    description: string;
    progress: number;
    questions: Question[];
    vocabulary: VocabularyPair[];
    lastCompleted?: Date;
    bestScore?: number;
}

export interface TestResult {
    lessonId: number;
    lessonTitle: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAttempts: Record<string, number>;
    timeSpent: number;
    completedAt: Date;
    incorrectAnswers: {
        question: string;
        userAnswer: string;
        correctAnswer: string;
    }[];
} 