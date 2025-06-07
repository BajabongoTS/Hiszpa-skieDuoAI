export interface Question {
    type: 'multiple-choice' | 'text-input' | 'matching';
    question: string;
    correctAnswer: string;
    options?: string[];
    matchingPairs?: { spanish: string; polish: string }[];
    explanation?: string;
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