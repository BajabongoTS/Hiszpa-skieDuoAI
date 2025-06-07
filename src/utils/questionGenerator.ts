import type { Question } from '../types';

interface VocabularyPair {
    spanish: string;
    polish: string;
}

// Fisher-Yates shuffle algorithm for better randomization
const shuffleArray = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const parseVocabulary = (vocabText: string): VocabularyPair[] => {
    return vocabText
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
            const parts = line.split(' - ');
            if (parts.length !== 2) return null;
            
            return { 
                spanish: parts[0].trim(), 
                polish: parts[1].trim() 
            };
        })
        .filter((item): item is VocabularyPair => item !== null);
};

// Helper function to normalize Spanish text for comparison
const normalizeSpanishText = (text: string): string => {
    return text
        .toLowerCase()
        // Remove articles
        .replace(/^(el|la|los|las)\s+/i, '')
        // Replace diacritical marks
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Remove extra whitespace
        .trim();
};

export const createQuestionsFromVocab = (vocabulary: VocabularyPair[]): Question[] => {
    const questions: Question[] = [];
    
    // Create multiple choice questions (Spanish to Polish)
    vocabulary.forEach(item => {
        const options = [
            item.polish,
            ...shuffleArray(vocabulary
                .filter(v => v.spanish !== item.spanish)
                .map(v => v.polish))
                .slice(0, 3)
        ];
        
        questions.push({
            type: 'multiple-choice',
            question: `Co oznacza "${item.spanish}"?`,
            options: shuffleArray(options),
            correctAnswer: item.polish,
            explanation: `"${item.spanish}" oznacza "${item.polish}"`
        });
    });

    // Create multiple choice questions (Polish to Spanish)
    vocabulary.forEach(item => {
        const options = [
            item.spanish,
            ...shuffleArray(vocabulary
                .filter(v => v.polish !== item.polish)
                .map(v => v.spanish))
                .slice(0, 3)
        ];
        
        questions.push({
            type: 'multiple-choice',
            question: `Jak powiedzieć "${item.polish}" po hiszpańsku?`,
            options: shuffleArray(options),
            correctAnswer: item.spanish,
            explanation: `"${item.polish}" to po hiszpańsku "${item.spanish}"`
        });
    });

    // Create text input questions (both directions)
    vocabulary.forEach(item => {
        questions.push({
            type: 'text-input',
            question: `Wpisz hiszpańskie słowo oznaczające "${item.polish}"`,
            correctAnswer: normalizeSpanishText(item.spanish),
            explanation: `"${item.polish}" to po hiszpańsku "${item.spanish}"`
        });

        questions.push({
            type: 'text-input',
            question: `Wpisz polskie tłumaczenie słowa "${item.spanish}"`,
            correctAnswer: item.polish.toLowerCase(),
            explanation: `"${item.spanish}" oznacza "${item.polish}"`
        });
    });

    // Create matching questions (in groups of 4)
    for (let i = 0; i < vocabulary.length; i += 4) {
        const pairs = vocabulary.slice(i, i + 4);
        if (pairs.length === 4) {
            // Create shuffled arrays for display
            const shuffledSpanish = shuffleArray(pairs.map(p => p.spanish));
            const shuffledPolish = shuffleArray(pairs.map(p => p.polish));
            
            // Ensure Spanish and Polish words don't accidentally align
            for (let j = 0; j < shuffledSpanish.length; j++) {
                const originalPair = pairs.find(p => p.spanish === shuffledSpanish[j]);
                if (originalPair && originalPair.polish === shuffledPolish[j]) {
                    const swapIndex = (j + 1) % shuffledPolish.length;
                    [shuffledPolish[j], shuffledPolish[swapIndex]] = 
                    [shuffledPolish[swapIndex], shuffledPolish[j]];
                }
            }

            questions.push({
                type: 'matching',
                question: 'Dopasuj słowa do ich znaczeń',
                matchingPairs: pairs,
                displayOrder: Math.random(), // Random number between 0 and 1 for display order
                correctAnswer: 'all-matched'
            });
        }
    }

    // Shuffle all questions
    return shuffleArray(questions);
}; 