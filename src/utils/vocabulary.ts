type QuestionType = 'multiple-choice' | 'text-input' | 'matching';

interface Question {
    type: QuestionType;
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    matchingPairs?: Array<{ spanish: string; polish: string }>;
}

export const parseVocabulary = (data: string): Array<{ spanish: string; polish: string }> => {
    return data.split('\n')
        .filter(line => line.trim())
        .map(line => {
            // Handle both ' - ' and ':' as separators
            const parts = line.includes(' - ') ? line.split(' - ') : line.split(':');
            if (parts.length !== 2) return null;
            
            return { 
                spanish: parts[0].trim(), 
                polish: parts[1].trim() 
            };
        })
        .filter((item): item is { spanish: string; polish: string } => item !== null);
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

export const createQuestionsFromVocab = (vocabulary: Array<{ spanish: string; polish: string }>): Question[] => {
    const questions: Question[] = [];
    
    // Create multiple choice questions
    vocabulary.forEach(item => {
        const options = [
            item.polish,
            ...vocabulary
                .filter(v => v.spanish !== item.spanish)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(v => v.polish)
        ].sort(() => Math.random() - 0.5);

        questions.push({
            type: 'multiple-choice',
            question: `Co oznacza "${item.spanish}"?`,
            options,
            correctAnswer: item.polish,
            explanation: `${item.spanish} oznacza ${item.polish}`
        });
    });

    // Create text input questions
    vocabulary.forEach(item => {
        questions.push({
            type: 'text-input',
            question: `Jak powiedzieć "${item.polish}" po hiszpańsku?`,
            correctAnswer: normalizeSpanishText(item.spanish),
            explanation: `${item.polish} to po hiszpańsku ${item.spanish}`
        });
    });

    // Create matching pairs questions (in groups of 4)
    for (let i = 0; i < vocabulary.length; i += 4) {
        const pairs = vocabulary.slice(i, i + 4);
        if (pairs.length === 4) {
            questions.push({
                type: 'matching',
                question: 'Dopasuj słowa do ich znaczeń',
                matchingPairs: pairs,
                correctAnswer: 'all-matched'
            });
        }
    }

    return questions.sort(() => Math.random() - 0.5);
}; 