import type { Question } from '../types';

interface VocabularyPair {
    spanish: string;
    polish: string;
}

// Shuffle array helper function
const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const parseVocabulary = (vocabText: string): VocabularyPair[] => {
    return vocabText
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
            const [spanish, polish] = line.split(':').map(s => s.trim());
            return { spanish, polish };
        });
};

export const createQuestionsFromVocab = (vocab: VocabularyPair[]): Question[] => {
    const questions: Question[] = [];

    // Create matching questions
    const matchingGroups = [];
    for (let i = 0; i < vocab.length; i += 4) {
        const group = vocab.slice(i, i + 4);
        if (group.length === 4) {
            // Shuffle the group before adding it
            matchingGroups.push(shuffleArray(group));
        }
    }

    matchingGroups.forEach((group, index) => {
        questions.push({
            type: 'matching',
            question: `Dopasuj słowa do ich znaczeń (Grupa ${index + 1})`,
            // Shuffle the pairs again when creating the question
            matchingPairs: shuffleArray(group),
            correctAnswer: 'all-matched'
        });
    });

    // Create multiple choice questions
    vocab.forEach(pair => {
        // Get 3 random incorrect options
        const incorrectOptions = vocab
            .filter(v => v.polish !== pair.polish)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(v => v.polish);

        const options = [...incorrectOptions, pair.polish]
            .sort(() => Math.random() - 0.5);

        questions.push({
            type: 'multiple-choice',
            question: `Co oznacza "${pair.spanish}"?`,
            options,
            correctAnswer: pair.polish,
            explanation: `"${pair.spanish}" oznacza "${pair.polish}" po polsku.`
        });
    });

    // Create text input questions
    vocab.forEach(pair => {
        questions.push({
            type: 'text-input',
            question: `Wpisz hiszpańskie słowo oznaczające "${pair.polish}"`,
            correctAnswer: pair.spanish,
            explanation: `"${pair.spanish}" to poprawne tłumaczenie słowa "${pair.polish}".`
        });
    });

    return shuffleArray(questions);
}; 