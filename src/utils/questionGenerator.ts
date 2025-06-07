import type { Question } from '../types';

interface VocabularyPair {
    spanish: string;
    polish: string;
}

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
            matchingGroups.push(group);
        }
    }

    matchingGroups.forEach((group, index) => {
        questions.push({
            type: 'matching',
            question: `Dopasuj słowa do ich znaczeń (Grupa ${index + 1})`,
            matchingPairs: group,
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

    return questions.sort(() => Math.random() - 0.5);
}; 