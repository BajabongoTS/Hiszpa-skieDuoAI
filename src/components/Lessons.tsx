import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    VStack,
    Text,
    useToast,
    HStack,
    useDisclosure,
    Input,
    IconButton,
    Heading,
    Progress,
    CircularProgress,
    CircularProgressLabel,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    Tooltip,
    Icon,
    Grid,
    ScaleFade,
    SimpleGrid,
    useColorModeValue
} from '@chakra-ui/react';
import { FaArrowLeft, FaClock, FaQuestion } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { setCookie, getCookie, removeCookie } from '../utils/cookies';
import type { Question, Lesson, TestResult } from '../types';
import { parseVocabulary, createQuestionsFromVocab } from '../utils/vocabulary';
import { bodyPartsVocab, foodVocab, excursionVocab } from '../data/vocabulary';
import TestStats from './TestStats';

const MotionBox = motion(Box);

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

interface IncorrectPairs {
    spanish: string;
    polish: string;
}

interface QuestionScore {
    question: string;
    points: number;
    attempts: number;
    usedDontKnow: boolean;
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
    }
];

// Generate questions for each lesson
lessonsData.forEach(lesson => {
    lesson.questions = createQuestionsFromVocab(lesson.vocabulary);
});

const Lessons = () => {
    const [lessons, setLessons] = useState<Lesson[]>(() => {
        // Try to get saved lessons from cookies
        const savedLessons = getCookie('lessonsProgress');
        if (savedLessons) {
            // Merge saved progress with current lesson data
            return lessonsData.map(lesson => {
                const savedLesson = savedLessons.find((sl: Lesson) => sl.id === lesson.id);
                return {
                    ...lesson,
                    progress: savedLesson?.progress || 0,
                    bestScore: savedLesson?.bestScore || 0,
                    lastCompleted: savedLesson?.lastCompleted ? new Date(savedLesson.lastCompleted) : undefined
                };
            });
        }
        return lessonsData;
    });
    
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedSpanish, setSelectedSpanish] = useState<string | null>(null);
    const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(30);
    const [timerActive, setTimerActive] = useState(true);
    const [canExtendTime, setCanExtendTime] = useState(true);
    const [incorrectPairs, setIncorrectPairs] = useState<IncorrectPairs | null>(null);
    const [isAnsweredCorrectly, setIsAnsweredCorrectly] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [incorrectAttempts, setIncorrectAttempts] = useState<Record<string, number>>({});
    const [testStartTime, setTestStartTime] = useState<Date | null>(null);
    const [questionsToRepeat, setQuestionsToRepeat] = useState<Question[]>([]);
    const [isInRepeatMode, setIsInRepeatMode] = useState(false);
    const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();
    const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null);
    const [questionScores, setQuestionScores] = useState<Record<string, QuestionScore>>({});

    // Save lessons state to cookies whenever it changes
    useEffect(() => {
        if (lessons) {
            const progressData = lessons.map(lesson => ({
                id: lesson.id,
                progress: lesson.progress,
                bestScore: lesson.bestScore,
                lastCompleted: lesson.lastCompleted
            }));
            setCookie('lessonsProgress', progressData);
        }
    }, [lessons]);

    // Load saved lesson state when component mounts
    useEffect(() => {
        const savedCurrentLesson = getCookie('currentLesson');
        const savedQuestionIndex = getCookie('currentQuestionIndex');
        const savedIncorrectAttempts = getCookie('incorrectAttempts');

        if (savedCurrentLesson) {
            setCurrentLesson(savedCurrentLesson);
            setCurrentQuestionIndex(savedQuestionIndex || 0);
            setIncorrectAttempts(savedIncorrectAttempts || {});
        }
    }, []);

    // Save last test result to cookies whenever it changes
    useEffect(() => {
        if (lastTestResult) {
            setCookie('lastTestResult', lastTestResult);
        }
    }, [lastTestResult]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (timeLeft > 0 && currentLesson && !showExplanation && !isAnsweredCorrectly && timerActive) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [timeLeft, currentLesson, showExplanation, isAnsweredCorrectly, timerActive]);

    // Handle extending time
    const handleExtendTime = () => {
        if (canExtendTime) {
            setTimeLeft(prev => prev + 15);
            setCanExtendTime(false);
            toast({
                title: "Dodano czas!",
                description: "Otrzymałeś dodatkowe 15 sekund.",
                status: "info",
                duration: 2000,
                isClosable: true
            });
        }
    };

    // Start lesson function
    const startLesson = (lesson: Lesson) => {
        // Clear previous lesson state
        removeCookie('currentLesson');
        removeCookie('currentQuestionIndex');
        removeCookie('incorrectAttempts');
        
        setCurrentLesson(lesson);
        setCurrentQuestionIndex(0);
        resetQuestion();
        setTestStartTime(new Date());
        
        // Save initial lesson state
        setCookie('currentLesson', lesson);
        setCookie('currentQuestionIndex', 0);
        setCookie('incorrectAttempts', {});
    };

    // Reset question state
    const resetQuestion = () => {
        setTextInput('');
        setIsAnsweredCorrectly(false);
        setShowExplanation(false);
        setIncorrectAttempts({});
        setIncorrectPairs(null);
        setTimeLeft(30);
        setCanExtendTime(true);
        setTimerActive(true);
    };

    const calculateQuestionPoints = (usedDontKnow: boolean, attempts: number): number => {
        if (!usedDontKnow && attempts === 1) {
            return 1; // Correct on first try
        } else if (usedDontKnow && attempts === 1) {
            return 0.5; // Used "I don't know" on first try
        } else if (attempts === 2) {
            return 0.25; // Correct in first repeat
        } else {
            return 0; // More attempts or repeats
        }
    };

    const handleDontKnow = () => {
        if (!currentLesson) return;
        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        handleIncorrectAnswer(currentQuestion.question);
        
        // Update question score
        setQuestionScores(prev => ({
            ...prev,
            [currentQuestion.question]: {
                question: currentQuestion.question,
                points: calculateQuestionPoints(
                    true,
                    (prev[currentQuestion.question]?.attempts || 0) + 1
                ),
                attempts: (prev[currentQuestion.question]?.attempts || 0) + 1,
                usedDontKnow: true
            }
        }));

        if (!isInRepeatMode) {
            setQuestionsToRepeat(prev => [...prev, currentQuestion]);
        } else {
            setQuestionsToRepeat(prev => [...prev, currentQuestion]);
        }
        setShowCorrectAnswer(true);
        setTimerActive(false);
        toast({
            title: "Pytanie dodane do powtórki",
            description: "To pytanie pojawi się ponownie na końcu lekcji",
            status: "info",
            duration: 2000,
            isClosable: true
        });
    };

    const handleIncorrectAnswer = (question: string) => {
        setIncorrectAttempts(prev => ({
            ...prev,
            [question]: (prev[question] || 0) + 1
        }));
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
                isCorrect = normalizeSpanishText(currentQuestion.correctAnswer) === normalizeSpanishText(answer);
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

        // Update question score for correct answer
        const currentAttempts = (questionScores[currentQuestion.question]?.attempts || 0) + 1;
        const usedDontKnow = questionScores[currentQuestion.question]?.usedDontKnow || false;
        
        setQuestionScores(prev => ({
            ...prev,
            [currentQuestion.question]: {
                question: currentQuestion.question,
                points: calculateQuestionPoints(
                    usedDontKnow,
                    currentAttempts
                ),
                attempts: currentAttempts,
                usedDontKnow
            }
        }));

        setIsAnsweredCorrectly(true);
        toast({
            title: "Poprawna odpowiedź!",
            description: "Świetnie! Tak trzymaj!",
            status: "success",
            duration: 2000,
            isClosable: true,
        });
    };

    const handleMatchingClick = (word: string, isSpanish: boolean) => {
        if (!currentLesson) return;

        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        if (currentQuestion.type !== 'matching') return;

        if (isSpanish) {
            setSelectedSpanish(word);
        } else if (selectedSpanish) {
            // Find the correct pair
            const correctPair = currentQuestion.matchingPairs?.find(pair => 
                pair.spanish === selectedSpanish && pair.polish === word
            );

            if (correctPair) {
                const newMatchedPairs = {
                    ...matchedPairs,
                    [selectedSpanish]: word
                };
                setMatchedPairs(newMatchedPairs);

                // Check if all pairs are matched correctly
                if (currentQuestion.matchingPairs && 
                    Object.keys(newMatchedPairs).length === currentQuestion.matchingPairs.length) {
                    setIsAnsweredCorrectly(true);
                    setTimerActive(false);
                    toast({
                        title: "Poprawna odpowiedź!",
                        description: "Świetnie! Tak trzymaj!",
                        status: "success",
                        duration: 2000,
                        isClosable: true,
                    });
                }
            } else {
                handleIncorrectAnswer(currentQuestion.question);
                setIncorrectPairs({ spanish: selectedSpanish, polish: word });
                setTimeout(() => {
                    setIncorrectPairs(null);
                }, 2000);
            }
            setSelectedSpanish(null);
        }
    };

    const renderQuestion = (question: Question, isLastQuestion: boolean = false) => {
        if (!question) return null;

        const accentColor = 'teal.500';
        const buttonColorScheme = 'teal';

        return (
            <VStack spacing={6} align="stretch" w="100%" maxW="800px" mx="auto">
                {/* <Text fontSize="2xl" fontWeight="bold" color={accentColor}>{question.question}</Text> */}

                {question.type === 'multiple-choice' && question.options && (
                    <Box position="relative">
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
                            {question.options.map((option, index) => (
                                <ScaleFade in={true} key={index}>
                                    <Button
                                        onClick={() => handleAnswer(option)}
                                        size="lg"
                                        height="80px"
                                        w="100%"
                                        colorScheme={isAnsweredCorrectly ? 'green' : buttonColorScheme}
                                        variant={isAnsweredCorrectly ? 'solid' : 'outline'}
                                        isDisabled={isAnsweredCorrectly || showExplanation || showCorrectAnswer}
                                        _hover={{ transform: 'scale(1.02)' }}
                                        transition="all 0.2s"
                                        fontSize="xl"
                                        position="relative"
                                        overflow="hidden"
                                    >
                                        {option}
                                    </Button>
                                </ScaleFade>
                            ))}
                        </SimpleGrid>
                        {!(isAnsweredCorrectly || showExplanation || showCorrectAnswer) && (
                            <Button
                                leftIcon={<FaQuestion />}
                                onClick={handleDontKnow}
                                colorScheme="gray"
                                variant="outline"
                                size="md"
                                width="100%"
                                mt={2}
                            >
                                Nie wiem (pomiń pytanie)
                            </Button>
                        )}
                        {showCorrectAnswer && (
                            <Box
                                mt={4}
                                p={4}
                                bg={useColorModeValue('red.50', 'red.900')}
                                borderRadius="lg"
                                borderWidth="1px"
                                borderColor={useColorModeValue('red.200', 'red.700')}
                            >
                                <VStack spacing={2} align="stretch">
                                    <Text color={useColorModeValue('red.600', 'red.200')} fontSize="lg">
                                        Poprawna odpowiedź: {question.correctAnswer}
                                    </Text>
                                </VStack>
                            </Box>
                        )}
                        {(isAnsweredCorrectly || showCorrectAnswer) && (
                            <Button
                                onClick={handleNextQuestion}
                                colorScheme="teal"
                                size="lg"
                                width="100%"
                                mt={4}
                                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                transition="all 0.2s"
                            >
                                {isLastQuestion ? 'Zakończ test' : 'Następne pytanie'}
                            </Button>
                        )}
                    </Box>
                )}

                {question.type === 'text-input' && (
                    <Box position="relative">
                        <VStack spacing={4} w="100%">
                            <Box
                                p={6}
                                bg={useColorModeValue('white', 'gray.700')}
                                borderRadius="lg"
                                boxShadow="md"
                                borderWidth="1px"
                                borderColor={useColorModeValue('gray.200', 'gray.600')}
                                w="100%"
                            >
                                <Input
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Wpisz odpowiedź..."
                                    size="lg"
                                    fontSize="xl"
                                    textAlign="center"
                                    isDisabled={isAnsweredCorrectly || showExplanation || showCorrectAnswer}
                                    _focus={{
                                        borderColor: `${accentColor}`,
                                        boxShadow: `0 0 0 1px var(--chakra-colors-${buttonColorScheme}-500)`
                                    }}
                                    autoFocus
                                />
                                <Button
                                    onClick={() => handleAnswer(textInput)}
                                    colorScheme={buttonColorScheme}
                                    size="lg"
                                    width="100%"
                                    mt={4}
                                    isDisabled={!textInput || isAnsweredCorrectly || showExplanation || showCorrectAnswer}
                                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                    transition="all 0.2s"
                                >
                                    Sprawdź
                                </Button>
                                {!(isAnsweredCorrectly || showExplanation || showCorrectAnswer) && (
                                    <Button
                                        leftIcon={<FaQuestion />}
                                        onClick={handleDontKnow}
                                        colorScheme="gray"
                                        variant="outline"
                                        size="md"
                                        width="100%"
                                        mt={2}
                                    >
                                        Nie wiem (pomiń pytanie)
                                    </Button>
                                )}
                                {showCorrectAnswer && (
                                    <Box
                                        mt={4}
                                        p={4}
                                        bg={useColorModeValue('red.50', 'red.900')}
                                        borderRadius="lg"
                                        borderWidth="1px"
                                        borderColor={useColorModeValue('red.200', 'red.700')}
                                    >
                                        <VStack spacing={2} align="stretch">
                                            <Text color={useColorModeValue('red.600', 'red.200')} fontSize="lg">
                                                Poprawna odpowiedź: {question.correctAnswer}
                                            </Text>
                                        </VStack>
                                    </Box>
                                )}
                                {(isAnsweredCorrectly || showCorrectAnswer) && (
                                    <Button
                                        onClick={handleNextQuestion}
                                        colorScheme="teal"
                                        size="lg"
                                        width="100%"
                                        mt={4}
                                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                        transition="all 0.2s"
                                    >
                                        {isLastQuestion ? 'Zakończ test' : 'Następne pytanie'}
                                    </Button>
                                )}
                            </Box>
                        </VStack>
                    </Box>
                )}

                {question.type === 'matching' && (
                    <Box position="relative">
                        <Box
                            p={6}
                            bg={useColorModeValue('white', 'gray.700')}
                            borderRadius="lg"
                            boxShadow="md"
                            borderWidth="1px"
                            borderColor={useColorModeValue('gray.200', 'gray.600')}
                            w="100%"
                        >
                            <Grid templateColumns="1fr 1fr" gap={8}>
                                <VStack spacing={4} align="stretch">
                                    <Text fontSize="lg" fontWeight="bold" textAlign="center" mb={2} color={accentColor}>
                                        Hiszpański
                                    </Text>
                                    {question.matchingPairs?.map((pair, index) => (
                                        <ScaleFade in={true} key={`spanish-${index}`}>
                                            <Button
                                                onClick={() => handleMatchingClick(pair.spanish, true)}
                                                colorScheme={
                                                    selectedSpanish === pair.spanish
                                                        ? buttonColorScheme
                                                        : pair.spanish in matchedPairs
                                                        ? 'green'
                                                        : 'gray'
                                                }
                                                variant={selectedSpanish === pair.spanish ? 'solid' : 'outline'}
                                                isDisabled={pair.spanish in matchedPairs || isAnsweredCorrectly || showExplanation || showCorrectAnswer}
                                                w="100%"
                                                h="60px"
                                                fontSize="lg"
                                                _hover={{ transform: 'scale(1.02)' }}
                                                transition="all 0.2s"
                                            >
                                                {pair.spanish}
                                            </Button>
                                        </ScaleFade>
                                    ))}
                                </VStack>
                                <VStack spacing={4} align="stretch">
                                    <Text fontSize="lg" fontWeight="bold" textAlign="center" mb={2} color={accentColor}>
                                        Polski
                                    </Text>
                                    {question.matchingPairs?.map((pair, index) => (
                                        <ScaleFade in={true} key={`polish-${index}`}>
                                            <Button
                                                onClick={() => handleMatchingClick(pair.polish, false)}
                                                colorScheme={
                                                    Object.values(matchedPairs).includes(pair.polish)
                                                        ? 'green'
                                                        : 'gray'
                                                }
                                                variant="outline"
                                                isDisabled={Object.values(matchedPairs).includes(pair.polish) || isAnsweredCorrectly || showExplanation || showCorrectAnswer}
                                                w="100%"
                                                h="60px"
                                                fontSize="lg"
                                                _hover={{ transform: 'scale(1.02)' }}
                                                transition="all 0.2s"
                                            >
                                                {pair.polish}
                                            </Button>
                                        </ScaleFade>
                                    ))}
                                </VStack>
                            </Grid>
                            {!(isAnsweredCorrectly || showExplanation || showCorrectAnswer) && (
                                <Button
                                    leftIcon={<FaQuestion />}
                                    onClick={handleDontKnow}
                                    colorScheme="gray"
                                    variant="outline"
                                    size="md"
                                    width="100%"
                                    mt={2}
                                >
                                    Nie wiem (pomiń pytanie)
                                </Button>
                            )}
                            {showCorrectAnswer && (
                                <Box
                                    mt={4}
                                    p={4}
                                    bg={useColorModeValue('red.50', 'red.900')}
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor={useColorModeValue('red.200', 'red.700')}
                                >
                                    <VStack spacing={2} align="stretch">
                                        <Text color={useColorModeValue('red.600', 'red.200')} fontSize="lg">
                                            Poprawne pary:
                                        </Text>
                                        {question.matchingPairs?.map((pair, index) => (
                                            <Text key={index} color={useColorModeValue('red.600', 'red.200')} fontSize="md">
                                                {pair.spanish} → {pair.polish}
                                            </Text>
                                        ))}
                                    </VStack>
                                </Box>
                            )}
                            {(isAnsweredCorrectly || showCorrectAnswer) && (
                                <Button
                                    onClick={handleNextQuestion}
                                    colorScheme="teal"
                                    size="lg"
                                    width="100%"
                                    mt={4}
                                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                    transition="all 0.2s"
                                >
                                    {isLastQuestion ? 'Zakończ test' : 'Następne pytanie'}
                                </Button>
                            )}
                        </Box>
                    </Box>
                )}

                {incorrectPairs && (
                    <Box
                        mt={4}
                        p={6}
                        bg={useColorModeValue('red.50', 'red.900')}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={useColorModeValue('red.200', 'red.700')}
                    >
                        <VStack spacing={2} align="stretch">
                            <Text color={useColorModeValue('red.600', 'red.200')} fontSize="lg">
                                Twoja odpowiedź: {incorrectPairs.spanish}
                            </Text>
                            <Text color={useColorModeValue('green.600', 'green.200')} fontSize="lg">
                                Poprawna odpowiedź: {incorrectPairs.polish}
                            </Text>
                        </VStack>
                    </Box>
                )}

                {showExplanation && !isAnsweredCorrectly && (
                    <Button
                        onClick={handleNextQuestion}
                        colorScheme={buttonColorScheme}
                        size="lg"
                        width="100%"
                        mt={4}
                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                        transition="all 0.2s"
                    >
                        Następne pytanie
                    </Button>
                )}
            </VStack>
        );
    };

    const handleNextQuestion = () => {
        if (!currentLesson) return;
        setShowCorrectAnswer(false);
        
        // Reset states for next question
        setTextInput('');
        setMatchedPairs({});
        setSelectedSpanish(null);
        setTimeLeft(30);
        setTimerActive(true);
        setCanExtendTime(true);
        setIsAnsweredCorrectly(false);
        
        const moveToNextQuestion = () => {
            setCurrentQuestionIndex(prev => prev + 1);
        };

        const startRepeatMode = () => {
            setIsInRepeatMode(true);
            const questionsForRepeat = [...questionsToRepeat];
            setCurrentLesson(prev => ({
                ...prev!,
                questions: questionsForRepeat
            }));
            setQuestionsToRepeat([]);
            setCurrentQuestionIndex(0);
            toast({
                title: "Czas na powtórkę!",
                description: `Masz ${questionsForRepeat.length} pytań do powtórzenia`,
                status: "info",
                duration: 3000,
                isClosable: true
            });
        };

        const continueRepeatMode = () => {
            const questionsForRepeat = [...questionsToRepeat];
            setCurrentLesson(prev => ({
                ...prev!,
                questions: questionsForRepeat
            }));
            setQuestionsToRepeat([]);
            setCurrentQuestionIndex(0);
            toast({
                title: "Kolejna runda powtórki",
                description: `Pozostało ${questionsForRepeat.length} pytań do nauczenia się`,
                status: "info",
                duration: 3000,
                isClosable: true
            });
        };

        const finishLesson = () => {
            const endTime = new Date();
            const testDuration = testStartTime ? (endTime.getTime() - testStartTime.getTime()) / 1000 : 0;
            
            const totalQuestions = currentLesson!.questions.length;
            
            // Calculate total points based on the new scoring system
            const totalPoints = Object.values(questionScores).reduce((sum, score) => sum + score.points, 0);
            const maxPossiblePoints = totalQuestions; // Since each question can get max 1 point
            const score = Math.round((totalPoints / maxPossiblePoints) * 100);
            
            // Update lesson progress and statistics
            const updatedLessons = lessons.map(lesson =>
                lesson.id === currentLesson!.id
                    ? {
                        ...lesson,
                        progress: Math.max(lesson.progress || 0, score),
                        bestScore: Math.max(lesson.bestScore || 0, score),
                        lastCompleted: new Date()
                    }
                    : lesson
            );
            
            setLessons(updatedLessons);
            
            // Save lessons progress to cookies
            const progressData = updatedLessons.map(l => ({
                id: l.id,
                progress: l.progress,
                bestScore: l.bestScore,
                lastCompleted: l.lastCompleted
            }));
            setCookie('lessonsProgress', progressData);
            
            // Create detailed test result with new scoring
            const testResult: TestResult = {
                lessonId: currentLesson!.id,
                lessonTitle: currentLesson!.title,
                score,
                totalQuestions,
                correctAnswers: Object.values(questionScores).filter(s => s.points > 0).length,
                incorrectAttempts,
                timeSpent: Math.round(testDuration),
                completedAt: new Date(),
                incorrectAnswers: Object.entries(questionScores)
                    .filter(([_, score]) => score.points < 1)
                    .map(([question, score]) => ({
                        question,
                        userAnswer: `Points: ${score.points.toFixed(2)}, Attempts: ${score.attempts}, Used "Don't Know": ${score.usedDontKnow}`,
                        correctAnswer: currentLesson!.questions.find(q => q.question === question)?.correctAnswer || ''
                    }))
            };

            // Save test result to cookies
            const existingResults = getCookie('testResults') || [];
            const updatedResults = [testResult, ...existingResults].slice(0, 50);
            setCookie('testResults', updatedResults);
            
            setLastTestResult(testResult);
            
            // Update today's activity counter
            const today = new Date().toDateString();
            const todayKey = `todayLessons_${today}`;
            const todayLessons = getCookie(todayKey) || 0;
            setCookie(todayKey, todayLessons + 1);
            
            // Reset all states
            setCurrentLesson(null);
            setCurrentQuestionIndex(0);
            setTestStartTime(null);
            setIsInRepeatMode(false);
            setIncorrectAttempts({});
            setQuestionsToRepeat([]);
            setShowCorrectAnswer(false);
            setTextInput('');
            setMatchedPairs({});
            setSelectedSpanish(null);
            setTimeLeft(30);
            setTimerActive(true);
            setCanExtendTime(true);
            setQuestionScores({});
            
            onOpen();
        };

        if (currentQuestionIndex < currentLesson.questions.length - 1) {
            moveToNextQuestion();
        } else if (questionsToRepeat.length > 0) {
            if (!isInRepeatMode) {
                startRepeatMode();
            } else {
                continueRepeatMode();
            }
        } else {
            finishLesson();
        }
    };

    useEffect(() => {
        if (currentLesson && currentLesson.questions[currentQuestionIndex]) {
            setMatchedPairs({});
            setSelectedSpanish(null);
            setTimeLeft(30);
        }
    }, [currentQuestionIndex, currentLesson]);

    if (currentLesson) {
        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        const isLastQuestion = currentQuestionIndex === currentLesson.questions.length - 1;

        return (
            <ScaleFade initialScale={0.9} in={true}>
                <VStack spacing={6} p={8} align="stretch" maxW="800px" mx="auto">
                    <HStack justify="space-between" align="center" position="relative">
                        <IconButton
                            aria-label="Return to tests"
                            icon={<FaArrowLeft />}
                            onClick={() => {
                                const shouldExit = window.confirm('Czy na pewno chcesz wrócić do listy testów? Twój postęp zostanie utracony.');
                                if (shouldExit) {
                                    // Reset all test-related state
                                    setCurrentLesson(null);
                                    setCurrentQuestionIndex(0);
                                    setShowExplanation(false);
                                    setTextInput('');
                                    setMatchedPairs({});
                                    setSelectedSpanish(null);
                                    setTimeLeft(30);
                                    setTimerActive(true);
                                    setCanExtendTime(true);
                                    setIncorrectPairs(null);
                                    setIsAnsweredCorrectly(false);
                                    setIncorrectAttempts({});
                                    setTestStartTime(null);
                                    setQuestionsToRepeat([]);
                                    setIsInRepeatMode(false);
                                    setShowCorrectAnswer(false);
                                }
                            }}
                            size="sm"
                            variant="ghost"
                            mr={2}
                        />
                        <Heading size="lg" mx="auto">
                            {currentLesson.title}
                            {isInRepeatMode && (
                                <Text
                                    as="span"
                                    fontSize="md"
                                    color="orange.500"
                                    ml={2}
                                >
                                    (Tryb powtórki)
                                </Text>
                            )}
                        </Heading>
                    </HStack>

                    <VStack align="end" spacing={0}>
                        <Text>
                            Pytanie {currentQuestionIndex + 1} z {currentLesson.questions.length}
                            {isInRepeatMode && (
                                <Text
                                    as="span"
                                    color="orange.500"
                                    ml={2}
                                >
                                    (Powtórka)
                                </Text>
                            )}
                        </Text>
                    </VStack>

                    <Progress
                        value={(currentQuestionIndex / currentLesson.questions.length) * 100}
                        size="sm"
                        colorScheme="teal"
                        borderRadius="full"
                    />
                    <Box p={6} borderWidth={1} borderRadius="lg" bg="white" _dark={{ bg: 'gray.700' }}>
                        <VStack spacing={4} position="relative" role="group">
                            <HStack w="100%" justify="center" align="center" mb={2}>
                                <IconButton
                                    aria-label="Add 15 seconds"
                                    icon={<FaClock />}
                                    onClick={handleExtendTime}
                                    isDisabled={!canExtendTime || isAnsweredCorrectly}
                                    colorScheme={canExtendTime ? "teal" : "gray"}
                                    size="md"
                                />
                                <CircularProgress
                                    value={(timeLeft / 30) * 100}
                                    color={timeLeft > 10 ? "green.400" : "red.400"}
                                    size="70px"
                                    thickness="8px"
                                    trackColor={useColorModeValue('gray.200', 'gray.600')}
                                >
                                    <CircularProgressLabel fontSize="2xl" fontWeight="bold">
                                        {timeLeft}s
                                    </CircularProgressLabel>
                                </CircularProgress>
                            </HStack>
                            <Text fontSize="xl" fontWeight="bold" textAlign="center">{currentQuestion.question}</Text>
                            {renderQuestion(currentQuestion, isLastQuestion)}
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
                        leftIcon={<FaClock />}
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
                                <Button
                                    colorScheme="teal"
                                    onClick={() => startLesson(lesson)}
                                    leftIcon={lesson.progress === 100 ? <FaClock /> : undefined}
                                >
                                    {lesson.progress === 100 ? 'Powtórz' : 'Rozpocznij'}
                                </Button>
                                {lesson.bestScore !== undefined && lesson.bestScore > 0 && (
                                    <Tooltip label={`Najlepszy wynik: ${lesson.bestScore}%`} placement="top">
                                        <HStack spacing={2} justify="center">
                                            <Icon as={FaClock} boxSize={5} />
                                            <Text>{lesson.bestScore}%</Text>
                                        </HStack>
                                    </Tooltip>
                                )}
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