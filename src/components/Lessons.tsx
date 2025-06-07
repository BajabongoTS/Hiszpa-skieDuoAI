import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    VStack,
    Text,
    useToast,
    HStack,
    useDisclosure,
    SimpleGrid,
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
    ScaleFade
} from '@chakra-ui/react';
import { FaArrowLeft, FaChartBar, FaCheck, FaRedo, FaClock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { setCookie, getCookie, removeCookie } from '../utils/cookies';
import type { Question, Lesson } from '../types';
import { lessonsData } from '../data/lessonsData';
import TestStats from './TestStats';
import type { TestResult } from './TestStats';
import { parseVocabulary, createQuestionsFromVocab } from '../utils/vocabulary';
import { bodyPartsVocab, foodVocab, excursionVocab } from '../data/vocabulary';

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
        let timer: NodeJS.Timeout;
        if (timeLeft > 0 && currentLesson && !showExplanation && !isAnsweredCorrectly) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [timeLeft, currentLesson, showExplanation, isAnsweredCorrectly]);

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
    };

    const handleNextQuestion = () => {
        if (!currentLesson) return;

        if (currentQuestionIndex < currentLesson.questions.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            setCookie('currentQuestionIndex', nextIndex);
            resetQuestion();
        } else {
            // Handle test completion
            const endTime = new Date();
            const testDuration = testStartTime ? (endTime.getTime() - testStartTime.getTime()) / 1000 : 0;
            
            // Calculate score
            const totalQuestions = currentLesson.questions.length;
            const incorrectCount = Object.values(incorrectAttempts).reduce((sum, count) => sum + count, 0);
            const score = Math.max(0, Math.round((1 - incorrectCount / totalQuestions) * 100));
            
            // Update lesson progress
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
            
            // Save progress
            setLessons(updatedLessons);
            
            // Show results
            const testResult = {
                lessonId: currentLesson.id,
                score,
                duration: testDuration,
                incorrectAttempts: Object.keys(incorrectAttempts).length,
                totalQuestions,
                completedAt: new Date()
            };
            setLastTestResult(testResult);
            setCookie('lastTestResult', testResult);
            onOpen();
            
            // Clear current lesson state
            removeCookie('currentLesson');
            removeCookie('currentQuestionIndex');
            removeCookie('incorrectAttempts');
            
            // Reset state
            setCurrentLesson(null);
            setCurrentQuestionIndex(0);
            resetQuestion();
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

    const handleAnswer = (answer: string) => {
        if (!currentLesson) return;
        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        let isCorrect = false;

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

        setShowExplanation(true);
    };

    const handleMatchingClick = (word: string, isSpanish: boolean) => {
        if (!currentLesson || isAnsweredCorrectly) return;
        
        if (isSpanish) {
            setSelectedSpanish(word);
            setIncorrectPairs(null);
        } else if (selectedSpanish) {
            const currentQuestion = currentLesson?.questions[currentQuestionIndex];
            const isCorrectMatch = currentQuestion?.matchingPairs?.some(
                pair => pair.spanish === selectedSpanish && pair.polish === word
            );

            if (isCorrectMatch) {
                const newPairs = { ...matchedPairs, [selectedSpanish]: word };
                setMatchedPairs(newPairs);
                setSelectedSpanish(null);
                setIncorrectPairs(null);

                // Check if all pairs are matched correctly
                if (currentQuestion?.matchingPairs && 
                    Object.keys(newPairs).length === currentQuestion.matchingPairs.length) {
                    setIsAnsweredCorrectly(true);
                    setShowExplanation(true);
                }
            } else {
                setIncorrectPairs({ spanish: selectedSpanish, polish: word });
                setTimeout(() => {
                    setIncorrectPairs(null);
                    setSelectedSpanish(null);
                }, 1000);
            }
        }
    };

    // Update the matching UI rendering
    const renderMatchingQuestion = (question: Question) => {
        if (!question.matchingPairs) return null;

        // Use displayOrder if available, otherwise use the original pairs
        const spanishWords = question.displayOrder?.spanish || question.matchingPairs.map(pair => pair.spanish);
        const polishWords = question.displayOrder?.polish || question.matchingPairs.map(pair => pair.polish);

        return (
            <VStack spacing={4} w="100%">
                <SimpleGrid columns={2} spacing={4} w="100%">
                    <VStack spacing={4} align="stretch">
                        {spanishWords.map((word, index) => (
                            <Button
                                key={`spanish-${index}`}
                                onClick={() => handleMatchingClick(word, true)}
                                colorScheme={selectedSpanish === word ? 'blue' : 
                                           matchedPairs[word] ? 'green' : 
                                           incorrectPairs?.spanish === word ? 'red' : 'gray'}
                                variant={selectedSpanish === word ? 'solid' : 'outline'}
                                isDisabled={!!matchedPairs[word] || isAnsweredCorrectly}
                            >
                                {word}
                            </Button>
                        ))}
                    </VStack>
                    <VStack spacing={4} align="stretch">
                        {polishWords.map((word, index) => (
                            <Button
                                key={`polish-${index}`}
                                onClick={() => handleMatchingClick(word, false)}
                                colorScheme={Object.values(matchedPairs).includes(word) ? 'green' : 
                                           incorrectPairs?.polish === word ? 'red' : 'gray'}
                                variant="outline"
                                isDisabled={Object.values(matchedPairs).includes(word) || isAnsweredCorrectly}
                            >
                                {word}
                            </Button>
                        ))}
                    </VStack>
                </SimpleGrid>
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
                return renderMatchingQuestion(question);
            default:
                return null;
        }
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
                                <Button
                                    colorScheme="teal"
                                    onClick={() => startLesson(lesson)}
                                    leftIcon={lesson.progress === 100 ? <FaRedo /> : undefined}
                                >
                                    {lesson.progress === 100 ? 'Powtórz' : 'Rozpocznij'}
                                </Button>
                                {lesson.bestScore !== undefined && lesson.bestScore > 0 && (
                                    <Tooltip label={`Najlepszy wynik: ${lesson.bestScore}%`} placement="top">
                                        <HStack spacing={2} justify="center">
                                            <Icon as={FaCheck} boxSize={5} />
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