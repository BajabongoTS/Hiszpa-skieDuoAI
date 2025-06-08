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
// const normalizeSpanishText = (text: string): string => {
//     return text
//         .toLowerCase()
//         // Remove articles
//         .replace(/^(el|la|los|las)\s+/i, '')
//         // Replace diacritical marks
//         .normalize('NFD')
//         .replace(/[\u0300-\u036f]/g, '')
//         // Remove extra whitespace
//         .trim();
// };

interface IncorrectPairs {
    spanish: string;
    polish: string;
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
    const [incorrectPairs, setIncorrectPairs] = useState<IncorrectPairs | null>(null);
    const [textInput, setTextInput] = useState('');
    const [isAnsweredCorrectly, setIsAnsweredCorrectly] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [incorrectAttempts, setIncorrectAttempts] = useState<Record<string, number>>({});
    const [testStartTime, setTestStartTime] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();
    const [canExtendTime, setCanExtendTime] = useState(true);
    const [questionsToRepeat, setQuestionsToRepeat] = useState<Question[]>([]);
    const [isInRepeatMode, setIsInRepeatMode] = useState(false);
    const [timerActive, setTimerActive] = useState(true);

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

    useEffect(() => {
        if (timeLeft === 0) {
            handleDontKnow();
        }
    }, [timeLeft]);

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

    const handleNextQuestion = () => {
        if (!currentLesson) return;

        if (currentQuestionIndex < currentLesson.questions.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            setCookie('currentQuestionIndex', nextIndex);
            resetQuestion();
        } else if (questionsToRepeat.length > 0 && !isInRepeatMode) {
            // Start repeat mode
            setIsInRepeatMode(true);
            setCurrentQuestionIndex(0);
            currentLesson.questions = questionsToRepeat;
            toast({
                title: "Czas na powtórkę!",
                description: `Masz ${questionsToRepeat.length} pytań do powtórzenia`,
                status: "info",
                duration: 3000,
                isClosable: true
            });
            resetQuestion();
        } else {
            // Handle test completion
            const endTime = new Date();
            const testDuration = testStartTime ? (endTime.getTime() - testStartTime.getTime()) / 1000 : 0;
            
            const totalQuestions = currentLesson.questions.length;
            const incorrectCount = Object.values(incorrectAttempts).reduce((sum, count) => sum + count, 0);
            const score = Math.max(0, Math.round((1 - incorrectCount / totalQuestions) * 100));
            
            const updatedLessons = lessons.map(lesson =>
                lesson.id === currentLesson.id
                    ? {
                        ...lesson,
                        progress: Math.max(lesson.progress || 0, score),
                        bestScore: Math.max(lesson.bestScore || 0, score),
                        lastCompleted: new Date()
                    }
                    : lesson
            );
            
            setLessons(updatedLessons);
            
            const testResult: TestResult = {
                lessonId: currentLesson.id,
                lessonTitle: currentLesson.title,
                score,
                totalQuestions,
                correctAnswers: totalQuestions - Object.keys(incorrectAttempts).length,
                incorrectAttempts,
                timeSpent: Math.round(testDuration),
                completedAt: new Date(),
                incorrectAnswers: Object.entries(incorrectAttempts).map(([question, attempts]) => ({
                    question,
                    userAnswer: `Incorrect attempts: ${attempts}`,
                    correctAnswer: currentLesson.questions.find(q => q.question === question)?.correctAnswer || ''
                }))
            };
            setLastTestResult(testResult);
            
            const today = new Date().toDateString();
            const todayKey = `todayLessons_${today}`;
            const todayLessons = getCookie(todayKey) || 0;
            setCookie(todayKey, todayLessons + 1);
            
            setCurrentLesson(null);
            setCurrentQuestionIndex(0);
            setTestStartTime(null);
            setQuestionsToRepeat([]);
            setIsInRepeatMode(false);
            resetQuestion();
            
            onOpen();
        }
    };

    useEffect(() => {
        if (currentLesson && currentLesson.questions[currentQuestionIndex]) {
            setMatchedPairs({});
            setSelectedSpanish(null);
            setTimeLeft(30);
        }
    }, [currentQuestionIndex, currentLesson]);

    const handleDontKnow = () => {
        if (!currentLesson) return;
        
        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        handleIncorrectAnswer(currentQuestion.question);
        setQuestionsToRepeat(prev => [...prev, currentQuestion]);
        
        toast({
            title: "Pytanie dodane do powtórki",
            description: "To pytanie pojawi się ponownie na końcu lekcji",
            status: "info",
            duration: 2000,
            isClosable: true
        });

        handleNextQuestion();
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

        setIsAnsweredCorrectly(true);
        toast({
            title: "Poprawna odpowiedź!",
            description: "Świetnie! Tak trzymaj!",
            status: "success",
            duration: 2000,
            isClosable: true,
        });

        setTimeout(() => {
            if (currentQuestionIndex < currentLesson.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setIsAnsweredCorrectly(false);
                setTimeLeft(30);
                setTimerActive(true);
                setCanExtendTime(true);
            } else {
                finishLesson(currentLesson);
            }
        }, 2000);
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
                setMatchedPairs(prev => ({
                    ...prev,
                    [selectedSpanish]: word
                }));

                // Check if all pairs are matched
                const newMatchedPairs = { ...matchedPairs, [selectedSpanish]: word };
                if (currentQuestion.matchingPairs && 
                    Object.keys(newMatchedPairs).length === currentQuestion.matchingPairs.length) {
                    setIsAnsweredCorrectly(true);
                    setTimeout(() => {
                        handleNextQuestion();
                    }, 1000);
                }
            } else {
                handleIncorrectAnswer(currentQuestion.question);
            }
            setSelectedSpanish(null);
        }
    };

    const renderQuestion = (question: Question) => {
        if (!question) return null;

        const accentColor = 'teal.500';
        const buttonColorScheme = 'teal';

        return (
            <VStack spacing={6} align="stretch" w="100%" maxW="800px" mx="auto">
                <Box 
                    p={6} 
                    bg={useColorModeValue('white', 'gray.700')} 
                    borderRadius="lg" 
                    boxShadow="md"
                    borderWidth="1px"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                >
                    <HStack justify="space-between" mb={4}>
                        <Text fontSize="2xl" fontWeight="bold" color={accentColor}>{question.question}</Text>
                        <Button
                            leftIcon={<FaQuestion />}
                            onClick={handleDontKnow}
                            colorScheme={buttonColorScheme}
                            size="md"
                            isDisabled={isAnsweredCorrectly || showExplanation}
                        >
                            Nie wiem ({questionsToRepeat.length})
                        </Button>
                    </HStack>
                </Box>

                {question.type === 'multiple-choice' && question.options && (
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
                                    isDisabled={isAnsweredCorrectly || showExplanation}
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
                )}

                {question.type === 'text-input' && (
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
                                isDisabled={isAnsweredCorrectly || showExplanation}
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
                                isDisabled={!textInput || isAnsweredCorrectly || showExplanation}
                                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                transition="all 0.2s"
                            >
                                Sprawdź
                            </Button>
                        </Box>
                    </VStack>
                )}

                {question.type === 'matching' && (
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
                                            isDisabled={pair.spanish in matchedPairs}
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
                                            isDisabled={Object.values(matchedPairs).includes(pair.polish)}
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

                {isInRepeatMode && (
                    <Text
                        color={accentColor}
                        fontSize="md"
                        textAlign="center"
                        mt={4}
                        fontWeight="bold"
                    >
                        Tryb powtórki: {currentQuestionIndex + 1}/{questionsToRepeat.length}
                    </Text>
                )}
            </VStack>
        );
    };

    const finishLesson = (lesson: Lesson) => {
        if (!testStartTime) return;

        const timeSpent = Math.floor((new Date().getTime() - testStartTime.getTime()) / 1000);
        
        // Calculate the score based on incorrect attempts
        const totalQuestions = lesson.questions.length;
        const incorrectCount = Object.values(incorrectAttempts).reduce((sum, count) => sum + count, 0);
        const score = Math.max(0, Math.round((1 - incorrectCount / totalQuestions) * 100));

        // Create test result with all required properties
        const result: TestResult = {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            score,
            totalQuestions,
            correctAnswers: totalQuestions - Object.keys(incorrectAttempts).length,
            incorrectAttempts,
            timeSpent,
            completedAt: new Date(),
            incorrectAnswers: Object.entries(incorrectAttempts).map(([question, attempts]) => ({
                question,
                userAnswer: `Incorrect attempts: ${attempts}`,
                correctAnswer: lesson.questions.find(q => q.question === question)?.correctAnswer || ''
            }))
        };

        // Update lesson progress and best score
        const updatedLessons = lessons.map(l => 
            l.id === lesson.id
                ? {
                    ...l,
                    progress: Math.max(l.progress || 0, score),
                    bestScore: Math.max(l.bestScore || 0, score),
                    lastCompleted: new Date()
                }
                : l
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

        // Update today's activity counter
        const today = new Date().toDateString();
        const todayKey = `todayLessons_${today}`;
        const todayLessons = (getCookie(todayKey) || 0) + 1;
        setCookie(todayKey, todayLessons);

        // Save test result
        const existingResults = getCookie('testResults') || [];
        const updatedResults = [result, ...existingResults].slice(0, 50); // Keep last 50 results
        setCookie('testResults', updatedResults);

        setLastTestResult(result);
        onOpen(); // Show statistics modal

        // Reset state for next lesson
        setTestStartTime(null);
        setIncorrectAttempts({});
        setTimeLeft(30);
        setCanExtendTime(true);
        setCurrentLesson(null);
    };

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
                                const shouldExit = window.confirm('Czy na pewno chcesz wrócić do listy testów? Twój postęp zostanie zapisany.');
                                if (shouldExit) {
                                    setCurrentLesson(null);
                                }
                            }}
                            size="sm"
                            variant="ghost"
                            mr={2}
                        />
                        <Heading size="lg" mx="auto">
                            {currentLesson.title}
                        </Heading>
                    </HStack>

                    <VStack align="end" spacing={0}>
                        <Text>
                            Pytanie {currentQuestionIndex + 1} z {currentLesson.questions.length}
                        </Text>
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
                                        color={timeLeft > 10 ? "green.400" : "red.400"}
                                        size="40px"
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
                                    onClick={handleNextQuestion}
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