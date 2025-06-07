import React, { useState, useEffect } from 'react';
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
    Icon,
    Center
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaClock, FaChartBar, FaCheck, FaRedo } from 'react-icons/fa';
import { setCookie, getCookie } from '../utils/cookies';
import type { Question, Lesson, TestResult } from '../types';
import { normalizeSpanishText } from '../utils/textNormalization';
import TestStats from '../components/TestStats';

const MotionBox = motion(Box);

const shuffleArray = <T extends unknown>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const Lessons: React.FC = () => {
    const [lessons, setLessons] = useState<Lesson[]>(() => {
        const savedLessons = getCookie('lessons');
        if (savedLessons) {
            return savedLessons.map((savedLesson: Lesson) => ({
                ...savedLesson,
                lastCompleted: savedLesson.lastCompleted ? new Date(savedLesson.lastCompleted) : undefined,
                lastAttemptDate: savedLesson.lastAttemptDate ? new Date(savedLesson.lastAttemptDate) : null
            }));
        }
        return [];
    });
    
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);
    const [isAnsweredCorrectly, setIsAnsweredCorrectly] = useState(false);
    const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
    const [selectedSpanish, setSelectedSpanish] = useState<string | null>(null);
    const [textInput, setTextInput] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [timerActive, setTimerActive] = useState(true);
    const [canExtendTime, setCanExtendTime] = useState(true);
    const [questionsToRepeat, setQuestionsToRepeat] = useState<Set<number>>(new Set());
    const [isInRepeatMode, setIsInRepeatMode] = useState(false);
    const [incorrectAttempts, setIncorrectAttempts] = useState<Record<string, number>>({});
    const [testStartTime, setTestStartTime] = useState<Date | null>(null);
    const [lastTestResult, setLastTestResult] = useState<TestResult | null>(() => {
        const savedResult = getCookie('lastTestResult');
        return savedResult ? { ...savedResult, completedAt: new Date(savedResult.completedAt) } : null;
    });
    const { isOpen, onOpen, onClose } = useDisclosure();

    const toast = useToast();

    useEffect(() => {
        setCookie('lessons', lessons);
    }, [lessons]);

    useEffect(() => {
        if (currentLesson) {
            setCookie('currentLesson', currentLesson);
            setCookie('currentQuestionIndex', currentQuestionIndex);
            setCookie('questionsToRepeat', Array.from(questionsToRepeat));
            setCookie('isInRepeatMode', isInRepeatMode);
            setCookie('incorrectAttempts', incorrectAttempts);
            setTimeLeft(30);
            setTimerActive(true);
            setCanExtendTime(true);
            setQuestionsToRepeat(new Set());
            setIsInRepeatMode(false);
            setCurrentQuestionIndex(0);
            setIncorrectAttempts({});
            if (!testStartTime) {
                setTestStartTime(new Date());
            }
        }
    }, [currentLesson, currentQuestionIndex, questionsToRepeat, isInRepeatMode, incorrectAttempts]);

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

    const startLesson = (lesson: Lesson) => {
        const lessonToStart = lessons.find(l => l.id === lesson.id) || lesson;
        setCurrentLesson(lessonToStart);
        setCurrentQuestionIndex(0);
        setShowExplanation(false);
        setTextInput('');
        setMatchedPairs({});
        setSelectedSpanish(null);
        setIsAnsweredCorrectly(false);
        setTimeLeft(30);
        setTimerActive(true);
        setCanExtendTime(true);
        setQuestionsToRepeat(new Set());
        setIsInRepeatMode(false);
        setCurrentQuestionIndex(0);
        setIncorrectAttempts({});
        setTestStartTime(new Date());
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

    const handleMatchingClick = (value: string, isSpanish: boolean) => {
        if (!currentLesson || isAnsweredCorrectly) return;
        
        if (isSpanish) {
            setSelectedSpanish(value);
        } else if (selectedSpanish) {
            const currentQuestion = currentLesson.questions[currentQuestionIndex];
            const isCorrectMatch = currentQuestion.matchingPairs?.some(
                pair => pair.spanish === selectedSpanish && pair.polish === value
            );

            if (isCorrectMatch) {
                const newPairs = { ...matchedPairs, [selectedSpanish]: value };
                setMatchedPairs(newPairs);
                setSelectedSpanish(null);

                if (currentQuestion.matchingPairs && 
                    Object.keys(newPairs).length === currentQuestion.matchingPairs.length) {
                    handleAnswer('all-matched');
                }
            } else {
                toast({
                    title: "Niepoprawne dopasowanie",
                    status: "error",
                    duration: 1000,
                    isClosable: true,
                });
                setSelectedSpanish(null);
            }
        }
    };

    const finishLesson = (lesson: Lesson) => {
        if (!testStartTime) return;

        const timeSpent = Math.round((new Date().getTime() - testStartTime.getTime()) / 1000);
        const totalQuestions = lesson.questions.length;
        const correctAnswers = totalQuestions - questionsToRepeat.size;
        const score = Math.round((correctAnswers / totalQuestions) * 100);

        const result: TestResult = {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            score,
            totalQuestions,
            correctAnswers,
            incorrectAnswers: questionsToRepeat.size,
            timeSpent,
            completedAt: new Date(),
            incorrectAttempts
        };

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

        const existingResults = getCookie('testResults') || [];
        const updatedResults = [result, ...existingResults];
        setCookie('testResults', updatedResults);

        const today = new Date().toDateString();
        const todayKey = `todayLessons_${today}`;
        const todayLessons = getCookie(todayKey) || 0;
        setCookie(todayKey, todayLessons + 1);

        setLastTestResult(result);
        setCurrentLesson(null);
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
        
        if (isInRepeatMode) {
            const repeatArray = Array.from(questionsToRepeat);
            const currentRepeatIndex = repeatArray.indexOf(currentQuestionIndex);
            
            if (currentRepeatIndex < repeatArray.length - 1) {
                setCurrentQuestionIndex(repeatArray[currentRepeatIndex + 1]);
            } else if (questionsToRepeat.size > 0) {
                setCurrentQuestionIndex(repeatArray[0]);
                toast({
                    title: "Kolejna runda powtórek!",
                    description: `Pozostało ${questionsToRepeat.size} pytań do opanowania.`,
                    status: "info",
                    duration: 2000,
                    isClosable: true,
                });
            } else {
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

        if (currentQuestionIndex + 1 < totalQuestions) {
            setCurrentQuestionIndex((prev: number) => prev + 1);
        } else if (questionsToRepeat.size > 0) {
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

    const renderMatchingQuestion = (question: Question) => {
        if (!question.matchingPairs) return null;

        const pairs = question.matchingPairs;
        const shuffledPairs = React.useMemo(() => 
            shuffleArray([...pairs]), [pairs]);

        return (
            <VStack spacing={6} w="100%">
                <Grid templateColumns="1fr auto 1fr" gap={4} w="100%" alignItems="start">
                    <VStack spacing={4} align="stretch">
                        <Heading size="sm" textAlign="center">Hiszpański</Heading>
                        {shuffledPairs.map(pair => (
                            <Button
                                key={pair.spanish}
                                size="md"
                                variant={selectedSpanish === pair.spanish ? 'solid' : 'outline'}
                                colorScheme={incorrectAttempts[pair.spanish] ? 'red' : 'teal'}
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

                    <Center>
                        <Box h="full" w="2px" bg="gray.200" _dark={{ bg: 'gray.600' }} />
                    </Center>

                    <VStack spacing={4} align="stretch">
                        <Heading size="sm" textAlign="center">Polski</Heading>
                        {shuffleArray([...shuffledPairs]).map(pair => (
                            <Button
                                key={pair.polish}
                                size="md"
                                variant="outline"
                                colorScheme={incorrectAttempts[pair.polish] ? 'red' : 'teal'}
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