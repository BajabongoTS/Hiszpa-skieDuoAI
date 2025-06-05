import { Box, Grid, VStack, Heading, Text, Progress, Button, useToast, ScaleFade, Input, HStack, Tooltip, Icon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, IconButton, CircularProgress, CircularProgressLabel } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FaCheck, FaChartBar, FaClock, FaArrowLeft } from 'react-icons/fa';
import TestStats from './TestStats';
import type { TestResult } from './TestStats';
import FlashcardMode from './FlashcardMode';
import { useNavigate } from 'react-router-dom';
import { parseVocabulary, createQuestionsFromVocab } from '../utils/vocabulary';
import { bodyPartsVocab, foodVocab, excursionVocab, aWordsVocab } from '../data/vocabulary';

const MotionBox = motion(Box);

type QuestionType = 'multiple-choice' | 'text-input' | 'matching' | 'flashcard';

interface Question {
    type: QuestionType;
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    matchingPairs?: Array<{ spanish: string; polish: string }>;
    flashcardData?: { spanish: string; polish: string };
}

interface Lesson {
    id: number;
    title: string;
    description: string;
    progress: number;
    questions: Question[];
    vocabulary: Array<{ spanish: string; polish: string }>;
}

const lessonsData: Lesson[] = [
    {
        id: 1,
        title: "Części ciała",
        description: "Naucz się nazw części ciała po hiszpańsku",
        progress: 0,
        vocabulary: parseVocabulary(bodyPartsVocab),
        questions: []
    },
    {
        id: 2,
        title: "Jedzenie",
        description: "Poznaj słownictwo związane z jedzeniem",
        progress: 0,
        vocabulary: parseVocabulary(foodVocab),
        questions: []
    },
    {
        id: 3,
        title: "Wycieczka",
        description: "Słownictwo przydatne podczas wycieczek",
        progress: 0,
        vocabulary: parseVocabulary(excursionVocab),
        questions: []
    },
    {
        id: 4,
        title: "Słowa na 'a'",
        description: "Naucz się słów rodzaju żeńskiego zaczynających się na 'a'",
        progress: 0,
        vocabulary: parseVocabulary(aWordsVocab),
        questions: []
    }
];

// Generate questions for each lesson
lessonsData.forEach(lesson => {
    lesson.questions = createQuestionsFromVocab(lesson.vocabulary);
});

// Add these helper functions at the top of the file, before the Lessons component
const saveToLocalStorage = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
};

const loadFromLocalStorage = (key: string, defaultValue: any) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
};

const Lessons = () => {
    const [lessons, setLessons] = useState<Lesson[]>(() => 
        loadFromLocalStorage('lessons', lessonsData)
    );
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(() =>
        loadFromLocalStorage('currentLesson', null)
    );
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() =>
        loadFromLocalStorage('currentQuestionIndex', 0)
    );
    const [showExplanation, setShowExplanation] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
    const [selectedSpanish, setSelectedSpanish] = useState<string | null>(null);
    const [incorrectPairs, setIncorrectPairs] = useState<{ spanish: string; polish: string } | null>(null);
    const [isAnsweredCorrectly, setIsAnsweredCorrectly] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [timerActive, setTimerActive] = useState(true);
    const [canExtendTime, setCanExtendTime] = useState(true);
    const [questionsToRepeat, setQuestionsToRepeat] = useState<Set<number>>(() => 
        new Set(loadFromLocalStorage('questionsToRepeat', []))
    );
    const [isInRepeatMode, setIsInRepeatMode] = useState(() =>
        loadFromLocalStorage('isInRepeatMode', false)
    );
    const toast = useToast();
    const [incorrectAttempts, setIncorrectAttempts] = useState<Record<string, number>>(() =>
        loadFromLocalStorage('incorrectAttempts', {})
    );
    const [testStartTime, setTestStartTime] = useState<Date | null>(null);
    const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const navigate = useNavigate();

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (timerActive && timeLeft > 0 && currentLesson && !showExplanation && !isAnsweredCorrectly) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [timerActive, timeLeft, currentLesson, showExplanation, isAnsweredCorrectly]);

    useEffect(() => {
        if (timeLeft === 0 && timerActive) {
            handleDontKnow();
        }
    }, [timeLeft]);

    useEffect(() => {
        saveToLocalStorage('lessons', lessons);
    }, [lessons]);

    useEffect(() => {
        saveToLocalStorage('currentLesson', currentLesson);
    }, [currentLesson]);

    useEffect(() => {
        saveToLocalStorage('currentQuestionIndex', currentQuestionIndex);
    }, [currentQuestionIndex]);

    useEffect(() => {
        saveToLocalStorage('questionsToRepeat', Array.from(questionsToRepeat));
    }, [questionsToRepeat]);

    useEffect(() => {
        saveToLocalStorage('isInRepeatMode', isInRepeatMode);
    }, [isInRepeatMode]);

    useEffect(() => {
        saveToLocalStorage('incorrectAttempts', incorrectAttempts);
    }, [incorrectAttempts]);

    useEffect(() => {
        return () => {
            saveToLocalStorage('lessons', lessons);
            saveToLocalStorage('currentLesson', currentLesson);
            saveToLocalStorage('currentQuestionIndex', currentQuestionIndex);
            saveToLocalStorage('questionsToRepeat', Array.from(questionsToRepeat));
            saveToLocalStorage('isInRepeatMode', isInRepeatMode);
            saveToLocalStorage('incorrectAttempts', incorrectAttempts);
        };
    }, [lessons, currentLesson, currentQuestionIndex, questionsToRepeat, isInRepeatMode, incorrectAttempts]);

    const handleExtendTime = () => {
        if (canExtendTime) {
            setTimeLeft(prev => prev + 15);
            setCanExtendTime(false);
            toast({
                title: "Dodano czas!",
                description: "Otrzymałeś dodatkowe 15 sekund.",
                status: "info",
                duration: 2000,
                isClosable: true,
            });
        }
    };

    const startLesson = (lesson: Lesson) => {
        if (currentLesson?.id === lesson.id && currentQuestionIndex > 0) {
            const shouldResume = window.confirm(
                'Znaleziono zapisany postęp w tej lekcji. Czy chcesz kontynuować od ostatniego pytania?'
            );
            if (!shouldResume) {
                setCurrentQuestionIndex(0);
                setShowExplanation(false);
                setTextInput('');
                setMatchedPairs({});
                setSelectedSpanish(null);
                setIncorrectPairs(null);
                setIsAnsweredCorrectly(false);
                setTimeLeft(30);
                setTimerActive(true);
                setCanExtendTime(true);
                setQuestionsToRepeat(new Set());
                setIsInRepeatMode(false);
                setIncorrectAttempts({});
                setTestStartTime(new Date());
            }
        } else {
            setCurrentQuestionIndex(0);
            setShowExplanation(false);
            setTextInput('');
            setMatchedPairs({});
            setSelectedSpanish(null);
            setIncorrectPairs(null);
            setIsAnsweredCorrectly(false);
            setTimeLeft(30);
            setTimerActive(true);
            setCanExtendTime(true);
            setQuestionsToRepeat(new Set());
            setIsInRepeatMode(false);
            setIncorrectAttempts({});
            setTestStartTime(new Date());
        }
        setCurrentLesson(lesson);
    };

    const addToQuestionsToRepeat = (questionIndex: number) => {
        setQuestionsToRepeat((prev: Set<number>) => new Set([...Array.from(prev), questionIndex]));
    };

    const removeFromQuestionsToRepeat = (questionIndex: number) => {
        setQuestionsToRepeat((prev: Set<number>) => {
            const newSet = new Set(Array.from(prev));
            newSet.delete(questionIndex);
            return newSet;
        });
    };

    const handleDontKnow = () => {
        if (!currentLesson) return;
        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        setTimerActive(false);
        
        addToQuestionsToRepeat(currentQuestionIndex);

        toast({
            title: "Nie szkodzi!",
            description: `Prawidłowa odpowiedź to: ${
                currentQuestion.type === 'matching' 
                    ? 'Sprawdź poniższe pary'
                    : currentQuestion.correctAnswer
            }. To pytanie pojawi się ponownie na końcu testu.`,
            status: "info",
            duration: 3000,
            isClosable: true,
        });

        setShowExplanation(true);
        setIsAnsweredCorrectly(true);
    };

    const handleIncorrectAnswer = (question: string) => {
        setIncorrectAttempts(prev => ({
            ...prev,
            [question]: (prev[question] || 0) + 1
        }));
    };

    const finishLesson = (lesson: Lesson) => {
        if (!testStartTime) return;

        const timeSpent = Math.floor((new Date().getTime() - testStartTime.getTime()) / 1000);
        const result: TestResult = {
            lessonTitle: lesson.title,
            totalQuestions: lesson.questions.length,
            correctAnswers: lesson.questions.length - Object.keys(incorrectAttempts).length,
            incorrectAttempts,
            timeSpent,
            completedAt: new Date()
        };

        setLastTestResult(result);
        clearSavedProgress();
        onOpen();
    };

    const handleAnswer = (answer: string) => {
        if (!currentLesson) return;
        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        let isCorrect = false;

        setTimerActive(false);

        switch (currentQuestion.type) {
            case 'multiple-choice':
                isCorrect = currentQuestion.correctAnswer === answer;
                break;
            case 'text-input':
                isCorrect = currentQuestion.correctAnswer.toLowerCase() === answer.toLowerCase();
                break;
            case 'matching':
                isCorrect = Object.keys(matchedPairs).length === currentQuestion.matchingPairs!.length &&
                    currentQuestion.matchingPairs!.every(pair => 
                        matchedPairs[pair.spanish] === pair.polish
                    );
                break;
        }

        if (!isCorrect) {
            handleIncorrectAnswer(currentQuestion.question);
            toast({
                title: "Niepoprawna odpowiedź",
                description: "Spróbuj jeszcze raz!",
                status: "error",
                duration: 2000,
                isClosable: true,
            });
            setTimerActive(true);
            return;
        }

        if (questionsToRepeat.has(currentQuestionIndex)) {
            removeFromQuestionsToRepeat(currentQuestionIndex);
        }

        setIsAnsweredCorrectly(true);
        toast({
            title: "Poprawna odpowiedź!",
            description: "Świetnie! Tak trzymaj!",
            status: "success",
            duration: 2000,
            isClosable: true,
        });

        setShowExplanation(true);
    };

    const handleContinue = () => {
        setShowExplanation(false);
        setTextInput('');
        setMatchedPairs({});
        setSelectedSpanish(null);
        setIsAnsweredCorrectly(false);
        setTimerActive(true);
        setTimeLeft(30);
        setCanExtendTime(true);

        const totalQuestions = currentLesson!.questions.length;
        
        // If we're in repeat mode
        if (isInRepeatMode) {
            // Find next question to repeat
            const repeatArray = Array.from(questionsToRepeat);
            const currentRepeatIndex = repeatArray.indexOf(currentQuestionIndex);
            
            if (currentRepeatIndex < repeatArray.length - 1) {
                // Move to next repeat question
                setCurrentQuestionIndex(repeatArray[currentRepeatIndex + 1]);
            } else if (questionsToRepeat.size > 0) {
                // If we've completed one round of repeats but still have questions, start over
                setCurrentQuestionIndex(repeatArray[0]);
                toast({
                    title: "Kolejna runda powtórek!",
                    description: `Pozostało ${questionsToRepeat.size} pytań do opanowania.`,
                    status: "info",
                    duration: 2000,
                    isClosable: true,
                });
            } else {
                // All questions answered correctly, finish lesson
                const updatedLessons = lessons.map(l => {
                    if (l.id === currentLesson!.id) {
                        return { ...l, progress: 100 };
                    }
                    return l;
                });
                setLessons(updatedLessons);
                finishLesson(currentLesson!);
                setCurrentLesson(null);
            }
            return;
        }

        // Normal mode progression
        if (currentQuestionIndex + 1 < totalQuestions) {
            // Move to next question in normal sequence
            setCurrentQuestionIndex((prev: number) => prev + 1);
        } else if (questionsToRepeat.size > 0) {
            // Switch to repeat mode
            setIsInRepeatMode(true);
            setCurrentQuestionIndex(Array.from(questionsToRepeat)[0]);
            toast({
                title: "Czas na powtórkę!",
                description: `Powtórzymy ${questionsToRepeat.size} pytań, które sprawiły trudność.`,
                status: "info",
                duration: 3000,
                isClosable: true,
            });
        } else {
            // No questions to repeat, finish lesson
            const updatedLessons = lessons.map(l => {
                if (l.id === currentLesson!.id) {
                    return { ...l, progress: 100 };
                }
                return l;
            });
            setLessons(updatedLessons);
            finishLesson(currentLesson!);
            setCurrentLesson(null);
        }
    };

    const checkAllPairsMatched = (currentPairs: Record<string, string>, matchingPairs: Array<{ spanish: string; polish: string }>) => {
        if (Object.keys(currentPairs).length !== matchingPairs.length) {
            return false;
        }
        
        return matchingPairs.every(pair => 
            currentPairs[pair.spanish] === pair.polish
        );
    };

    const handleMatchingClick = (value: string, isSpanish: boolean) => {
        if (!currentLesson || isAnsweredCorrectly) return;
        
        if (isSpanish) {
            setSelectedSpanish(value);
            setIncorrectPairs(null);
        } else if (selectedSpanish) {
            const currentQuestion = currentLesson?.questions[currentQuestionIndex];
            const isCorrectMatch = currentQuestion?.matchingPairs?.some(
                pair => pair.spanish === selectedSpanish && pair.polish === value
            );

            if (isCorrectMatch) {
                const newPairs = { ...matchedPairs, [selectedSpanish]: value };
                setMatchedPairs(newPairs);
                setSelectedSpanish(null);
                setIncorrectPairs(null);

                // Check if all pairs are matched correctly
                if (currentQuestion?.matchingPairs && checkAllPairsMatched(newPairs, currentQuestion.matchingPairs)) {
                    setIsAnsweredCorrectly(true);
                    toast({
                        title: "Świetnie!",
                        description: "Wszystkie pary zostały poprawnie dopasowane!",
                        status: "success",
                        duration: 2000,
                        isClosable: true,
                    });
                    
                    setShowExplanation(true);
                }
            } else {
                // Show error feedback for both words
                setIncorrectPairs({ spanish: selectedSpanish, polish: value });
                setTimeout(() => {
                    setIncorrectPairs(null);
                    setSelectedSpanish(null);
                }, 1000);
            }
        }
    };

    const renderQuestion = (question: Question) => {
        switch (question.type) {
            case 'multiple-choice':
                return (
                    <VStack spacing={4} w="100%">
                        <Grid templateColumns="repeat(2, 1fr)" gap={4} w="100%">
                            {question.options!.map((option, index) => (
                                <Button
                                    key={index}
                                    size="lg"
                                    variant="outline"
                                    onClick={() => handleAnswer(option)}
                                    _hover={{ transform: 'scale(1.02)' }}
                                    transition="all 0.2s"
                                    isDisabled={isAnsweredCorrectly}
                                >
                                    {option}
                                </Button>
                            ))}
                        </Grid>
                        <Button
                            onClick={handleDontKnow}
                            variant="ghost"
                            colorScheme="gray"
                            size="md"
                            mt={4}
                            isDisabled={isAnsweredCorrectly}
                        >
                            Nie wiem
                        </Button>
                    </VStack>
                );
            case 'text-input':
                return (
                    <VStack spacing={4} w="100%">
                        <Input
                            placeholder="Wpisz odpowiedź..."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            size="lg"
                            isDisabled={isAnsweredCorrectly}
                        />
                        <Button
                            onClick={() => handleAnswer(textInput)}
                            isDisabled={!textInput.trim() || isAnsweredCorrectly}
                            w="100%"
                        >
                            Sprawdź
                        </Button>
                        <Button
                            onClick={handleDontKnow}
                            variant="ghost"
                            colorScheme="gray"
                            size="md"
                            isDisabled={isAnsweredCorrectly}
                        >
                            Nie wiem
                        </Button>
                    </VStack>
                );
            case 'matching':
                return (
                    <VStack spacing={6} w="100%">
                        <Grid templateColumns="1fr auto 1fr" gap={4} w="100%" alignItems="start">
                            <VStack spacing={4} align="stretch">
                                <Heading size="sm" textAlign="center">Hiszpański</Heading>
                                {question.matchingPairs!.map(pair => (
                                    <Button
                                        key={pair.spanish}
                                        size="md"
                                        variant={selectedSpanish === pair.spanish ? 'solid' : 'outline'}
                                        colorScheme={incorrectPairs?.spanish === pair.spanish ? 'red' : 'teal'}
                                        onClick={() => handleMatchingClick(pair.spanish, true)}
                                        isDisabled={matchedPairs[pair.spanish] !== undefined || isAnsweredCorrectly}
                                        w="100%"
                                        justifyContent="flex-start"
                                        px={4}
                                        transition="all 0.2s"
                                    >
                                        {pair.spanish}
                                    </Button>
                                ))}
                            </VStack>

                            <VStack spacing={4} pt={12}>
                                {question.matchingPairs!.map((_, index) => (
                                    <Box key={index} h="40px" display="flex" alignItems="center">
                                        {matchedPairs[question.matchingPairs![index].spanish] && (
                                            <Box
                                                w="40px"
                                                h="2px"
                                                bg="teal.500"
                                                _dark={{ bg: 'teal.300' }}
                                            />
                                        )}
                                    </Box>
                                ))}
                            </VStack>

                            <VStack spacing={4} align="stretch">
                                <Heading size="sm" textAlign="center">Polski</Heading>
                                {question.matchingPairs!.map(pair => (
                                    <Button
                                        key={pair.polish}
                                        size="md"
                                        variant="outline"
                                        colorScheme={incorrectPairs?.polish === pair.polish ? 'red' : 'teal'}
                                        onClick={() => handleMatchingClick(pair.polish, false)}
                                        isDisabled={Object.values(matchedPairs).includes(pair.polish) || isAnsweredCorrectly}
                                        w="100%"
                                        justifyContent="flex-start"
                                        px={4}
                                        transition="all 0.2s"
                                    >
                                        {pair.polish}
                                    </Button>
                                ))}
                            </VStack>
                        </Grid>

                        {Object.keys(matchedPairs).length > 0 && (
                            <Box w="100%" p={4} borderWidth={1} borderRadius="md">
                                <Heading size="sm" mb={2}>Dopasowane pary:</Heading>
                                <VStack align="stretch" spacing={2}>
                                    {Object.entries(matchedPairs).map(([spanish, polish]) => (
                                        <HStack key={spanish} justify="center" p={2} bg="teal.50" borderRadius="md" _dark={{ bg: 'teal.900' }}>
                                            <Text fontWeight="medium">{spanish}</Text>
                                            <Text>→</Text>
                                            <Text fontWeight="medium">{polish}</Text>
                                        </HStack>
                                    ))}
                                </VStack>
                            </Box>
                        )}

                        <Button
                            onClick={handleDontKnow}
                            variant="ghost"
                            colorScheme="gray"
                            size="md"
                            mt={2}
                            isDisabled={isAnsweredCorrectly}
                        >
                            Nie wiem
                        </Button>
                    </VStack>
                );
            default:
                return null;
        }
    };

    // Add clearSavedProgress function
    const clearSavedProgress = () => {
        localStorage.removeItem('currentLesson');
        localStorage.removeItem('currentQuestionIndex');
        localStorage.removeItem('questionsToRepeat');
        localStorage.removeItem('isInRepeatMode');
        localStorage.removeItem('incorrectAttempts');
    };

    if (currentLesson) {
        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        const isLastQuestion = !isInRepeatMode && 
            currentQuestionIndex === currentLesson.questions.length - 1 && 
            questionsToRepeat.size === 0;

        return (
            <ScaleFade initialScale={0.9} in={true}>
                <VStack spacing={6} p={8} align="stretch" maxW="800px" mx="auto">
                    <HStack justify="space-between" align="center" position="relative">
                        <IconButton
                            aria-label="Return to tests"
                            icon={<FaArrowLeft />}
                            onClick={() => {
                                const shouldExit = window.confirm('Czy na pewno chcesz wrócić do listy testów? Twój postęp zostanie zapisany.');
                                if (shouldExit) {
                                    setCurrentLesson(null);
                                }
                            }}
                            position="absolute"
                            left={0}
                            colorScheme="teal"
                            variant="ghost"
                            size="md"
                        />
                        <Heading size="lg" mx="auto">
                            {currentLesson.title}
                            {isInRepeatMode && (
                                <Text as="span" fontSize="md" color="orange.500" ml={2}>
                                    (Tryb powtórki)
                                </Text>
                            )}
                        </Heading>
                    </HStack>

                    <VStack align="end" spacing={0}>
                        <Text>
                            {isInRepeatMode 
                                ? `Powtórka: ${Array.from(questionsToRepeat).indexOf(currentQuestionIndex) + 1} z ${questionsToRepeat.size}`
                                : `Pytanie ${currentQuestionIndex + 1} z ${currentLesson.questions.length}`
                            }
                        </Text>
                        {!isInRepeatMode && questionsToRepeat.size > 0 && (
                            <Text fontSize="sm" color="orange.500">
                                Pytania do powtórki: {questionsToRepeat.size}
                            </Text>
                        )}
                    </VStack>

                    <Progress
                        value={(currentQuestionIndex / currentLesson.questions.length) * 100}
                        size="sm"
                        colorScheme="teal"
                        borderRadius="full"
                    />
                    <Box p={6} borderWidth={1} borderRadius="lg" bg="white" _dark={{ bg: 'gray.700' }}>
                        <VStack spacing={4}>
                            <HStack w="100%" justify="space-between" align="center">
                                <Text fontSize="xl" fontWeight="bold">{currentQuestion.question}</Text>
                                <HStack spacing={2}>
                                    <IconButton
                                        aria-label="Add 15 seconds"
                                        icon={<FaClock />}
                                        onClick={handleExtendTime}
                                        isDisabled={!canExtendTime || isAnsweredCorrectly}
                                        colorScheme={canExtendTime ? "teal" : "gray"}
                                        size="sm"
                                    />
                                    <CircularProgress
                                        value={(timeLeft / 30) * 100}
                                        color={timeLeft > 10 ? "teal.400" : "red.400"}
                                        size="50px"
                                    >
                                        <CircularProgressLabel>{timeLeft}s</CircularProgressLabel>
                                    </CircularProgress>
                                </HStack>
                            </HStack>
                            {renderQuestion(currentQuestion)}
                            {showExplanation && currentQuestion.explanation && (
                                <Box
                                    mt={4}
                                    p={4}
                                    bg="teal.50"
                                    color="teal.800"
                                    borderRadius="md"
                                    _dark={{ bg: 'teal.900', color: 'teal.100' }}
                                >
                                    <Text>{currentQuestion.explanation}</Text>
                                </Box>
                            )}
                            {isAnsweredCorrectly && (
                                <Button
                                    onClick={handleContinue}
                                    colorScheme="teal"
                                    size="lg"
                                    mt={4}
                                    w="100%"
                                >
                                    {isLastQuestion ? 'Zakończ test' : 'Następne pytanie'}
                                </Button>
                            )}
                        </VStack>
                    </Box>
                </VStack>
            </ScaleFade>
        );
    }

    return (
        <VStack spacing={8} align="stretch" maxW="1200px" mx="auto" p={8}>
            <HStack justify="space-between">
                <Heading>Dostępne Lekcje</Heading>
                {lastTestResult && (
                    <Button
                        leftIcon={<FaChartBar />}
                        onClick={onOpen}
                        colorScheme="teal"
                        variant="outline"
                    >
                        Ostatnie wyniki
                    </Button>
                )}
            </HStack>
            <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
                {lessons.map((lesson, index) => (
                    <MotionBox
                        key={lesson.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <Box
                            p={6}
                            borderWidth={1}
                            borderRadius="lg"
                            bg="white"
                            _dark={{ bg: 'gray.700' }}
                            boxShadow="md"
                            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                            transition="all 0.2s"
                        >
                            <VStack align="stretch" spacing={4}>
                                <Heading size="md">{lesson.title}</Heading>
                                <Text>{lesson.description}</Text>
                                <Progress value={lesson.progress} rounded="md" />
                                <HStack spacing={2}>
                                    <Button
                                        onClick={() => startLesson(lesson)}
                                        colorScheme="teal"
                                        flex="1"
                                    >
                                        {lesson.progress === 100 ? 'Powtórz' : 'Rozpocznij'}
                                    </Button>
                                    {lesson.progress === 100 && (
                                        <Tooltip label="Ukończono!" placement="top">
                                            <Box
                                                as="span"
                                                color="green.500"
                                                _dark={{ color: 'green.300' }}
                                            >
                                                <Icon as={FaCheck} boxSize={5} />
                                            </Box>
                                        </Tooltip>
                                    )}
                                </HStack>
                            </VStack>
                        </Box>
                    </MotionBox>
                ))}
            </Grid>

            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Statystyki testu</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        {lastTestResult && <TestStats result={lastTestResult} />}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </VStack>
    );
};

export default Lessons; 