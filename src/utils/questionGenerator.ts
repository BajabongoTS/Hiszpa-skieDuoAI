import type { Question } from '../types';

interface VocabularyPair {
    spanish: string;
    polish: string;
}

const shuffleArray = <T,>(array: T[]): T[] => {
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

    // Create matching questions with randomized pairs
    const matchingGroups = [];
    const shuffledVocab = shuffleArray([...vocab]);
    
    for (let i = 0; i < shuffledVocab.length; i += 4) {
        const group = shuffledVocab.slice(i, i + 4);
        if (group.length === 4) {
            matchingGroups.push(group);
        }
    }

    matchingGroups.forEach((group, index) => {
        // Create different variations of matching questions
        const variations = [
            // Variation 1: Match Spanish to Polish
            {
                question: `Dopasuj hiszpańskie słowa do ich polskich znaczeń (Grupa ${index + 1})`,
                matchingPairs: group.map(pair => ({ spanish: pair.spanish, polish: pair.polish }))
            },
            // Variation 2: Match Polish to Spanish
            {
                question: `Dopasuj polskie słowa do ich hiszpańskich odpowiedników (Grupa ${index + 1})`,
                matchingPairs: group.map(pair => ({ spanish: pair.polish, polish: pair.spanish }))
            },
            // Variation 3: Mixed language question
            {
                question: `Połącz pasujące do siebie słowa (Grupa ${index + 1})`,
                matchingPairs: group.map((pair, i) => 
                    i % 2 === 0 
                        ? { spanish: pair.spanish, polish: pair.polish }
                        : { spanish: pair.polish, polish: pair.spanish }
                )
            }
        ];

        // Randomly select one variation
        const selectedVariation = variations[Math.floor(Math.random() * variations.length)];
        
        questions.push({
            type: 'matching',
            question: selectedVariation.question,
            matchingPairs: selectedVariation.matchingPairs,
            correctAnswer: 'all-matched'
        });
    });

    // Create multiple choice questions with randomized options
    vocab.forEach(pair => {
        // Randomly decide if we're asking for Spanish or Polish translation
        const isSpanishToPolish = Math.random() < 0.5;
        const question = isSpanishToPolish
            ? `Co oznacza "${pair.spanish}"?`
            : `Jak powiedzieć po hiszpańsku "${pair.polish}"?`;
        
        // Get incorrect options from the opposite language
        const incorrectOptions = vocab
            .filter(v => v !== pair)
            .map(v => isSpanishToPolish ? v.polish : v.spanish)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const correctAnswer = isSpanishToPolish ? pair.polish : pair.spanish;
        const options = shuffleArray([...incorrectOptions, correctAnswer]);

        questions.push({
            type: 'multiple-choice',
            question,
            options,
            correctAnswer,
            explanation: isSpanishToPolish
                ? `"${pair.spanish}" oznacza "${pair.polish}" po polsku.`
                : `"${pair.polish}" to po hiszpańsku "${pair.spanish}".`
        });
    });

    // Create text input questions with randomized direction
    vocab.forEach(pair => {
        // Randomly decide if we're asking for Spanish or Polish translation
        const isSpanishToPolish = Math.random() < 0.5;
        
        questions.push({
            type: 'text-input',
            question: isSpanishToPolish
                ? `Wpisz polskie tłumaczenie słowa "${pair.spanish}"`
                : `Wpisz hiszpańskie słowo oznaczające "${pair.polish}"`,
            correctAnswer: isSpanishToPolish ? pair.polish : pair.spanish,
            explanation: isSpanishToPolish
                ? `"${pair.spanish}" to po polsku "${pair.polish}".`
                : `"${pair.polish}" to po hiszpańsku "${pair.spanish}".`
        });
    });

    // Shuffle all questions
    return shuffleArray(questions);
}; 