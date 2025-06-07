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

// Add a shuffle function to randomize array order
const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
    const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
    const [selectedSpanish, setSelectedSpanish] = useState<string | null>(null);
    const [isAnsweredCorrectly, setIsAnsweredCorrectly] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [timerActive, setTimerActive] = useState(true);
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

    // Add state for shuffled pairs
    const [shuffledSpanish, setShuffledSpanish] = useState<string[]>([]);
    const [shuffledPolish, setShuffledPolish] = useState<string[]>([]);

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
        setIsAnsweredCorrectly(false);
        setTimeLeft(30);
        setTimerActive(true);
        setCanExtendTime(true);
        setQuestionsToRepeat(new Set());
        setIsInRepeatMode(false);
        setIncorrectAttempts({});
        setTestStartTime(new Date());
        setShuffledSpanish([]);
        setShuffledPolish([]);
    };

    // Add useEffect to shuffle pairs when question changes
    useEffect(() => {
        if (currentLesson && currentLesson.questions[currentQuestionIndex] && currentLesson.questions[currentQuestionIndex].type === 'matching' && currentLesson.questions[currentQuestionIndex].matchingPairs) {
            const pairs = currentLesson.questions[currentQuestionIndex].matchingPairs;
            setShuffledSpanish(shuffleArray(pairs.map(p => p.spanish)));
            setShuffledPolish(shuffleArray(pairs.map(p => p.polish)));
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
            <HStack spacing={8} align="stretch" justify="center">
                {/* Spanish words column */}
                <VStack spacing={4} minW="200px">
                    {shuffledSpanish.map(spanish => (
                        <Box
                            key={spanish}
                            p={4}
                            bg={selectedSpanish === spanish ? 'teal.500' : 'white'}
                            color={selectedSpanish === spanish ? 'white' : 'black'}
                            borderWidth={1}
                            borderColor={selectedSpanish === spanish ? 'teal.500' : 'gray.200'}
                            borderRadius="md"
                            cursor="pointer"
                            _hover={{
                                bg: selectedSpanish === spanish ? 'teal.600' : 'gray.50',
                                transform: 'translateY(-2px)',
                                boxShadow: 'md'
                            }}
                            transition="all 0.2s"
                            onClick={() => {
                                if (matchedPairs[spanish]) return;
                                setSelectedSpanish(spanish);
                            }}
                            opacity={matchedPairs[spanish] ? 0.5 : 1}
                            _dark={{
                                bg: selectedSpanish === spanish ? 'teal.500' : 'gray.700',
                                color: 'white',
                                borderColor: 'gray.600',
                                _hover: {
                                    bg: selectedSpanish === spanish ? 'teal.600' : 'gray.600'
                                }
                            }}
                        >
                            <Text textAlign="center">{spanish}</Text>
                        </Box>
                    ))}
                </VStack>

                {/* Polish words column */}
                <VStack spacing={4} minW="200px">
                    {shuffledPolish.map(polish => (
                        <Box
                            key={polish}
                            p={4}
                            bg="white"
                            borderWidth={1}
                            borderColor="gray.200"
                            borderRadius="md"
                            cursor={selectedSpanish ? 'pointer' : 'default'}
                            _hover={{
                                bg: selectedSpanish ? 'gray.50' : 'white',
                                transform: selectedSpanish ? 'translateY(-2px)' : 'none',
                                boxShadow: selectedSpanish ? 'md' : 'none'
                            }}
                            transition="all 0.2s"
                            onClick={() => {
                                if (!selectedSpanish || Object.values(matchedPairs).includes(polish)) return;
                                
                                const correctPair = question.matchingPairs?.find(
                                    pair => pair.spanish === selectedSpanish && pair.polish === polish
                                );

                                if (correctPair) {
                                    setMatchedPairs(prev => ({ ...prev, [selectedSpanish]: polish }));
                                    setSelectedSpanish(null);

                                    // Check if all pairs are matched
                                    if (Object.keys(matchedPairs).length + 1 === question.matchingPairs?.length) {
                                        setIsAnsweredCorrectly(true);
                                        setShowExplanation(true);
                                    }
                                } else {
                                    handleIncorrectAnswer(question.question);
                                    setSelectedSpanish(null);
                                    toast({
                                        title: "Niepoprawne dopasowanie",
                                        description: "Spróbuj jeszcze raz!",
                                        status: "error",
                                        duration: 2000,
                                        isClosable: true
                                    });
                                }
                            }}
                            opacity={Object.values(matchedPairs).includes(polish) ? 0.5 : 1}
                            _dark={{
                                bg: 'gray.700',
                                color: 'white',
                                borderColor: 'gray.600',
                                _hover: {
                                    bg: selectedSpanish ? 'gray.600' : 'gray.700'
                                }
                            }}
                        >
                            <Text textAlign="center">{polish}</Text>
                        </Box>
                    ))}
                </VStack>
            </HStack>
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