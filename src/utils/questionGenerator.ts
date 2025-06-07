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

// Fisher-Yates shuffle algorithm for better randomization
const shuffleArray = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const createQuestionsFromVocab = (vocab: VocabularyPair[]): Question[] => {
    const questions: Question[] = [];

    // Create matching questions with enhanced randomization
    const matchingGroups = [];
    for (let i = 0; i < vocab.length; i += 4) {
        const group = vocab.slice(i, i + 4);
        if (group.length === 4) {
            // Create a randomized group where Spanish and Polish words don't align
            const shuffledSpanish = shuffleArray(group.map(pair => pair.spanish));
            const shuffledPolish = shuffleArray(group.map(pair => pair.polish));
            
            // Ensure Spanish and Polish words don't accidentally align with their pairs
            for (let j = 0; j < shuffledSpanish.length; j++) {
                const originalPair = group.find(p => p.spanish === shuffledSpanish[j]);
                if (originalPair && originalPair.polish === shuffledPolish[j]) {
                    // If they align, swap with the next position (or first if at the end)
                    const swapIndex = (j + 1) % shuffledPolish.length;
                    [shuffledPolish[j], shuffledPolish[swapIndex]] = 
                    [shuffledPolish[swapIndex], shuffledPolish[j]];
                }
            }

            // Create the matching pairs in their original form for answer checking
            const matchingPairs = group.map(pair => ({
                spanish: pair.spanish,
                polish: pair.polish
            }));

            questions.push({
                type: 'matching',
                question: `Dopasuj słowa do ich znaczeń (Grupa ${matchingGroups.length + 1})`,
                matchingPairs,
                // Add display order for the UI to show words in random order
                displayOrder: {
                    spanish: shuffledSpanish,
                    polish: shuffledPolish
                },
                correctAnswer: 'all-matched'
            });
            
            matchingGroups.push(matchingPairs);
        }
    }

    // Create multiple choice questions
    vocab.forEach(pair => {
        const incorrectOptions = shuffleArray(
            vocab.filter(v => v.polish !== pair.polish)
        ).slice(0, 3).map(v => v.polish);

        const options = shuffleArray([...incorrectOptions, pair.polish]);

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

    // Shuffle the final questions array
    return shuffleArray(questions);
}; 