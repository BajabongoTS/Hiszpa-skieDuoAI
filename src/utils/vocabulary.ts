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
            const [spanish, polish] = line.split(' - ');
            return { 
                spanish: spanish.trim(), 
                polish: polish.trim() 
            };
        });
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
            correctAnswer: item.spanish.toLowerCase(),
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

    // Create "a" article questions for words starting with "a"
    vocabulary.forEach(item => {
        const spanishWord = item.spanish.toLowerCase();
        if (spanishWord.startsWith('la ') && spanishWord.split(' ')[1].startsWith('a')) {
            questions.push({
                type: 'text-input',
                question: `Wpisz rodzajnik dla słowa "${spanishWord.split(' ')[1]}"`,
                correctAnswer: 'la',
                explanation: `Słowo "${spanishWord.split(' ')[1]}" używa rodzajnika "la", ponieważ jest rodzaju żeńskiego.`
            });

            questions.push({
                type: 'multiple-choice',
                question: `Jaki jest poprawny rodzajnik dla słowa "${spanishWord.split(' ')[1]}"?`,
                options: ['la', 'el', 'los', 'las'],
                correctAnswer: 'la',
                explanation: `Słowo "${spanishWord.split(' ')[1]}" używa rodzajnika "la", ponieważ jest rodzaju żeńskiego.`
            });
        }
    });

    return questions.sort(() => Math.random() - 0.5);
}; 