import type { Lesson } from '../types';
import { createQuestionsFromVocab, parseVocabulary } from '../utils/questionGenerator';
import { bodyPartsVocab, foodVocab, excursionVocab, numbersVocab } from './vocabulary';

export const lessonsData: Lesson[] = [
    {
        id: 1,
        title: "Części ciała",
        description: "Naucz się nazw części ciała po hiszpańsku",
        progress: 0,
        vocabulary: parseVocabulary(bodyPartsVocab),
        questions: [
            {
                type: 'multiple-choice',
                question: "Co oznacza 'cabeza'?",
                options: ["Ręka", "Głowa", "Noga", "Oko"],
                correctAnswer: "Głowa",
                explanation: "Cabeza oznacza głowę w języku hiszpańskim."
            },
            {
                type: 'text-input',
                question: "Jak powiedzieć 'oko' po hiszpańsku?",
                correctAnswer: "ojo",
                explanation: "Ojo to podstawowe słowo oznaczające oko."
            },
            {
                type: 'matching',
                question: "Dopasuj części ciała do ich znaczeń",
                matchingPairs: [
                    { spanish: "mano", polish: "ręka" },
                    { spanish: "pierna", polish: "noga" },
                    { spanish: "nariz", polish: "nos" },
                    { spanish: "boca", polish: "usta" }
                ],
                correctAnswer: "all-matched"
            },
            ...createQuestionsFromVocab(parseVocabulary(bodyPartsVocab))
        ]
    },
    {
        id: 2,
        title: "Jedzenie",
        description: "Poznaj słownictwo związane z jedzeniem",
        progress: 0,
        vocabulary: parseVocabulary(foodVocab),
        questions: [
            {
                type: 'multiple-choice',
                question: "Co oznacza 'pan'?",
                options: ["Woda", "Mleko", "Chleb", "Mięso"],
                correctAnswer: "Chleb",
                explanation: "Pan to podstawowe słowo oznaczające chleb."
            },
            {
                type: 'text-input',
                question: "Jak powiedzieć 'woda' po hiszpańsku?",
                correctAnswer: "agua",
                explanation: "Agua to słowo oznaczające wodę."
            },
            {
                type: 'matching',
                question: "Dopasuj jedzenie do ich znaczeń",
                matchingPairs: [
                    { spanish: "leche", polish: "mleko" },
                    { spanish: "carne", polish: "mięso" },
                    { spanish: "pescado", polish: "ryba" },
                    { spanish: "fruta", polish: "owoc" }
                ],
                correctAnswer: "all-matched"
            },
            ...createQuestionsFromVocab(parseVocabulary(foodVocab))
        ]
    },
    {
        id: 3,
        title: "Wycieczka",
        description: "Słownictwo przydatne podczas wycieczek",
        progress: 0,
        vocabulary: parseVocabulary(excursionVocab),
        questions: [
            {
                type: 'multiple-choice',
                question: "Co oznacza 'hotel'?",
                options: ["Sklep", "Hotel", "Restauracja", "Bank"],
                correctAnswer: "Hotel",
                explanation: "Hotel to międzynarodowe słowo, które brzmi tak samo w hiszpańskim."
            },
            {
                type: 'text-input',
                question: "Jak powiedzieć 'plaża' po hiszpańsku?",
                correctAnswer: "playa",
                explanation: "Playa to słowo oznaczające plażę."
            },
            {
                type: 'matching',
                question: "Dopasuj miejsca do ich znaczeń",
                matchingPairs: [
                    { spanish: "restaurante", polish: "restauracja" },
                    { spanish: "museo", polish: "muzeum" },
                    { spanish: "banco", polish: "bank" },
                    { spanish: "tienda", polish: "sklep" }
                ],
                correctAnswer: "all-matched"
            },
            ...createQuestionsFromVocab(parseVocabulary(excursionVocab))
        ]
    },
    {
        id: 4,
        title: "Liczby 11-20",
        description: "Naucz się liczb od 11 do 20 po hiszpańsku",
        progress: 0,
        vocabulary: parseVocabulary(numbersVocab),
        questions: [
            {
                type: 'multiple-choice',
                question: "Jak powiedzieć '15' po hiszpańsku?",
                options: ["catorce", "quince", "dieciséis", "trece"],
                correctAnswer: "quince",
                explanation: "Quince to liczba 15 w języku hiszpańskim."
            },
            {
                type: 'text-input',
                question: "Wpisz hiszpańskie słowo oznaczające '13'",
                correctAnswer: "trece",
                explanation: "Trece to liczba 13 w języku hiszpańskim."
            },
            {
                type: 'matching',
                question: "Dopasuj liczby do ich wartości",
                matchingPairs: [
                    { spanish: "diecisiete", polish: "17" },
                    { spanish: "dieciocho", polish: "18" },
                    { spanish: "diecinueve", polish: "19" },
                    { spanish: "veinte", polish: "20" }
                ],
                correctAnswer: "all-matched"
            },
            ...createQuestionsFromVocab(parseVocabulary(numbersVocab))
        ]
    }
]; 