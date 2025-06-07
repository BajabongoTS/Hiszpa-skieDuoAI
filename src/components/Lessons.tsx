import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    VStack,
    Text,
    useToast,
    HStack,
    useDisclosure,
    Grid,
    Input,
    ScaleFade,
    IconButton,
    Heading,
    Progress,
    CircularProgress,
    CircularProgressLabel,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Tooltip,
    Icon
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaClock, FaChartBar, FaCheck, FaRedo } from 'react-icons/fa';
import { setCookie, getCookie } from '../utils/cookies';
import type { Question, Lesson, TestResult } from '../types';
import { lessonsData } from '../data/lessonsData';
import TestStats from '../components/TestStats';

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

const Lessons = () => {
    // Initialize state from cookies or default values
    const [lessons, setLessons] = useState<Lesson[]>(() => {
        const savedLessons = getCookie('lessons');
        // If we have saved lessons, use them, otherwise initialize with default data
        if (savedLessons) {
            return savedLessons.map((savedLesson: Lesson) => ({
                ...savedLesson,
                // Convert date strings back to Date objects
                lastCompleted: savedLesson.lastCompleted ? new Date(savedLesson.lastCompleted) : undefined,
                lastAttemptDate: savedLesson.lastAttemptDate ? new Date(savedLesson.lastAttemptDate) : null
            }));
        }
        return lessonsData;
    });
    
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [selectedSpanish, setSelectedSpanish] = useState<string | null>(null);
    const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
    const [incorrectPairs, setIncorrectPairs] = useState<{ spanish: string; polish: string } | null>(null);
    const [isAnsweredCorrectly, setIsAnsweredCorrectly] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [timerActive, setTimerActive] = useState(false);
    const [canExtendTime, setCanExtendTime] = useState(true);
    const [questionsToRepeat, setQuestionsToRepeat] = useState<Set<number>>(new Set());
    const [isInRepeatMode, setIsInRepeatMode] = useState(false);
    const toast = useToast();
    const [incorrectAttempts, setIncorrectAttempts] = useState<Record<string, number>>({});
    const [testStartTime, setTestStartTime] = useState<Date | null>(null);
    const [lastTestResult, setLastTestResult] = useState<TestResult | null>(() => {
        const savedResult = getCookie('lastTestResult');
        return savedResult ? { ...savedResult, completedAt: new Date(savedResult.completedAt) } : null;
    });
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Save lessons state to cookies whenever it changes
    useEffect(() => {
        setCookie('lessons', lessons);
    }, [lessons]);

    // Save current lesson state
    useEffect(() => {
        if (currentLesson) {
            setCookie('currentLesson', currentLesson);
            setCookie('currentQuestionIndex', currentQuestionIndex);
            setCookie('questionsToRepeat', Array.from(questionsToRepeat));
            setCookie('isInRepeatMode', isInRepeatMode);
            setCookie('incorrectAttempts', incorrectAttempts);
        }
    }, [currentLesson, currentQuestionIndex, questionsToRepeat, isInRepeatMode, incorrectAttempts]);

    // Save last test result to cookies whenever it changes
    useEffect(() => {
        if (lastTestResult) {
            setCookie('lastTestResult', lastTestResult);
        }
    }, [lastTestResult]);

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

    // Update the startLesson function to include resetting shuffled arrays
    const startLesson = (lesson: Lesson) => {
        const lessonToStart = lessons.find(l => l.id === lesson.id) || lesson;
        setCurrentLesson(lessonToStart);
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
    };

    // Update the useEffect to remove the unused pairs variable
    useEffect(() => {
        if (currentLesson && currentLesson.questions[currentQuestionIndex] && currentLesson.questions[currentQuestionIndex].type === 'matching' && currentLesson.questions[currentQuestionIndex].matchingPairs) {
            setMatchedPairs({});
            setSelectedSpanish(null);
        }
    }, [currentQuestionIndex, currentLesson]);

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
        const correctAnswers = lesson.questions.length - Object.keys(incorrectAttempts).length;
        const score = Math.round((correctAnswers / lesson.questions.length) * 100);

        const result: TestResult = {
            lessonTitle: lesson.title,
            totalQuestions: lesson.questions.length,
            correctAnswers,
            incorrectAttempts,
            timeSpent,
            completedAt: new Date()
        };

        // Update lesson progress and best score
        setLessons(prevLessons => {
            return prevLessons.map(l => {
                if (l.id === lesson.id) {
                    const newBestScore = l.bestScore ? Math.max(l.bestScore, score) : score;
                    return {
                        ...l,
                        progress: 100,
                        lastCompleted: new Date(),
                        bestScore: newBestScore
                    };
                }
                return l;
            });
        });

        // Save test results
        const existingResults = getCookie('testResults') || [];
        const updatedResults = [result, ...existingResults];
        setCookie('testResults', updatedResults);

        // Update today's lesson count
        const today = new Date().toDateString();
        const todayKey = `todayLessons_${today}`;
        const todayLessons = getCookie(todayKey) || 0;
        setCookie(todayKey, todayLessons + 1);

        setLastTestResult(result);
        setCurrentLesson(null); // Reset current lesson
        onOpen();
    };

    const handleMatchingClick = (value: string, isSpanish: boolean) => {
        if (!currentLesson || isAnsweredCorrectly) return;
        
        if (isSpanish) {
            setSelectedSpanish(value);
            setIncorrectPairs(null);
        } else if (selectedSpanish) {
            const currentQuestion = currentLesson.questions[currentQuestionIndex];
            const isCorrectMatch = currentQuestion.matchingPairs?.some(
                pair => pair.spanish === selectedSpanish && pair.polish === value
            );

            if (isCorrectMatch) {
                const newPairs = { ...matchedPairs, [selectedSpanish]: value };
                setMatchedPairs(newPairs);
                setSelectedSpanish(null);
                setIncorrectPairs(null);

                // Check if all pairs are matched correctly
                if (currentQuestion.matchingPairs && Object.keys(newPairs).length === currentQuestion.matchingPairs.length) {
                    setIsAnsweredCorrectly(true);
                    setShowExplanation(true);
                }
            } else {
                // Show error feedback for both words
                setIncorrectPairs({ spanish: selectedSpanish, polish: value });
                handleIncorrectAnswer(currentQuestion.question);
                setTimeout(() => {
                    setIncorrectPairs(null);
                    setSelectedSpanish(null);
                }, 1000);
            }
        }
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

    // Update the matching UI rendering
    const renderMatchingQuestion = (question: Question) => {
        if (!question.matchingPairs) return null;

        return (
            <VStack spacing={6} w="100%">
                <Box position="relative" w="100%">
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
                                    position="relative"
                                    zIndex="1"
                                >
                                    {pair.spanish}
                                </Button>
                            ))}
                        </VStack>

                        <Box position="relative" w="40px">
                            <svg
                                style={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'none'
                                }}
                            >
                                {Object.entries(matchedPairs).map(([spanish, polish]) => {
                                    const spanishIndex = question.matchingPairs!.findIndex(p => p.spanish === spanish);
                                    const polishIndex = question.matchingPairs!.findIndex(p => p.polish === polish);
                                    if (spanishIndex === -1 || polishIndex === -1) return null;

                                    const y1 = spanishIndex * 48 + 48; // 48px is button height + spacing
                                    const y2 = polishIndex * 48 + 48;

                                    return (
                                        <path
                                            key={spanish}
                                            d={`M 0,${y1} C 20,${y1} 20,${y2} 40,${y2}`}
                                            stroke="var(--chakra-colors-teal-500)"
                                            strokeWidth="2"
                                            fill="none"
                                            style={{
                                                animation: 'drawLine 0.5s ease-in-out forwards'
                                            }}
                                        />
                                    );
                                })}
                            </svg>
                        </Box>

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
                                    position="relative"
                                    zIndex="1"
                                >
                                    {pair.polish}
                                </Button>
                            ))}
                        </VStack>
                    </Grid>
                </Box>

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
                            onChange={handleInputChange}
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
                return renderMatchingQuestion(question);
            default:
                return null;
        }
    };

    // Add type for event handler
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTextInput(e.target.value);
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
                            size="sm"
                            variant="ghost"
                            mr={2}
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
                                        leftIcon={lesson.progress === 100 ? <FaRedo /> : undefined}
                                    >
                                        {lesson.progress === 100 ? 'Powtórz' : 'Rozpocznij'}
                                    </Button>
                                    {lesson.progress === 100 && (
                                        <Tooltip label={`Najlepszy wynik: ${lesson.bestScore}%`} placement="top">
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
                                {lesson.lastCompleted && (
                                    <Text fontSize="sm" color="gray.500">
                                        Ostatnio ukończono: {new Date(lesson.lastCompleted).toLocaleDateString()}
                                    </Text>
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