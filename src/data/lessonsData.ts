import type { Lesson } from '../types';
import { createQuestionsFromVocab, parseVocabulary } from '../utils/questionGenerator';
import { bodyPartsVocab, foodVocab, excursionVocab } from './vocabulary';

export const lessonsData: Lesson[] = [
    {
        id: 1,
        title: "Części ciała",
        description: "Naucz się nazw części ciała po hiszpańsku",
        progress: 0,
        questions: createQuestionsFromVocab(parseVocabulary(bodyPartsVocab))
    },
    {
        id: 2,
        title: "Jedzenie",
        description: "Poznaj słownictwo związane z jedzeniem",
        progress: 0,
        questions: createQuestionsFromVocab(parseVocabulary(foodVocab))
    },
    {
        id: 3,
        title: "Wycieczka",
        description: "Słownictwo przydatne podczas wycieczek",
        progress: 0,
        questions: createQuestionsFromVocab(parseVocabulary(excursionVocab))
    }
]; 