import { Box, Grid, VStack, Heading, Text, Progress, Button, useToast, ScaleFade, Input, HStack, Wrap, WrapItem, CircularProgress, CircularProgressLabel, IconButton, Tooltip, Icon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FaClock, FaCheck, FaChartBar } from 'react-icons/fa';
import TestStats from './TestStats';
import type { TestResult } from './TestStats';

const MotionBox = motion(Box);

type QuestionType = 'multiple-choice' | 'text-input' | 'matching';

interface Question {
    type: QuestionType;
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    matchingPairs?: Array<{ spanish: string; polish: string }>;
}

interface Lesson {
    id: number;
    title: string;
    description: string;
    progress: number;
    questions: Question[];
}

const lessonsData: Lesson[] = [
    {
        id: 1,
        title: "Podstawowe Powitania",
        description: "Naucz się podstawowych hiszpańskich powitań i pożegnań",
        progress: 0,
        questions: [
            {
                type: 'multiple-choice',
                question: "Jak powiedzieć 'Dzień dobry' po hiszpańsku?",
                options: ["Buenos días", "Buenas noches", "Adiós", "Gracias"],
                correctAnswer: "Buenos días",
                explanation: "Buenos días używamy rano i po południu, do około 18:00."
            },
            {
                type: 'text-input',
                question: "Wpisz hiszpańskie słowo oznaczające 'Do widzenia' (Hint: hasta ...)",
                correctAnswer: "luego",
                explanation: "Hasta luego to nieformalne pożegnanie, dosłownie oznacza 'do później'."
            },
            {
                type: 'matching',
                question: "Dopasuj powitania do ich znaczeń",
                matchingPairs: [
                    { spanish: "Buenos días", polish: "Dzień dobry" },
                    { spanish: "Buenas noches", polish: "Dobranoc" },
                    { spanish: "Hola", polish: "Cześć" },
                    { spanish: "Adiós", polish: "Do widzenia" }
                ],
                correctAnswer: "all-matched"
            },
            {
                type: 'multiple-choice',
                question: "Co oznacza 'Buenas tardes'?",
                options: ["Dzień dobry", "Dobry wieczór", "Dobranoc", "Do widzenia"],
                correctAnswer: "Dobry wieczór",
                explanation: "Buenas tardes używamy popołudniu i wieczorem, przed zmrokiem."
            },
            {
                type: 'text-input',
                question: "Jak powiedzieć 'Jak się masz?' po hiszpańsku? (¿Cómo ...?)",
                correctAnswer: "estás",
                explanation: "¿Cómo estás? to nieformalne pytanie o samopoczucie."
            },
            {
                type: 'matching',
                question: "Dopasuj zwroty grzecznościowe",
                matchingPairs: [
                    { spanish: "Por favor", polish: "Proszę" },
                    { spanish: "Gracias", polish: "Dziękuję" },
                    { spanish: "De nada", polish: "Nie ma za co" },
                    { spanish: "Perdón", polish: "Przepraszam" }
                ],
                correctAnswer: "all-matched"
            },
            {
                type: 'multiple-choice',
                question: "Które powitanie jest najbardziej formalne?",
                options: ["¡Hola!", "Buenos días", "¿Qué tal?", "¡Hey!"],
                correctAnswer: "Buenos días",
                explanation: "Buenos días jest najbardziej formalnym powitaniem."
            },
            {
                type: 'text-input',
                question: "Dokończ zdanie: 'Hasta ...' (do zobaczenia)",
                correctAnswer: "luego",
                explanation: "Hasta luego to popularne pożegnanie."
            }
        ]
    },
    {
        id: 2,
        title: "Liczby 1-10",
        description: "Podstawowe liczby w języku hiszpańskim",
        progress: 0,
        questions: [
            {
                type: 'multiple-choice',
                question: "Wybierz prawidłową kolejność liczb od 1 do 3",
                options: [
                    "uno, tres, dos",
                    "uno, dos, tres",
                    "dos, uno, tres",
                    "tres, dos, uno"
                ],
                correctAnswer: "uno, dos, tres",
                explanation: "Uno (1), dos (2), tres (3) to pierwsze trzy liczby w hiszpańskim."
            },
            {
                type: 'text-input',
                question: "Wpisz hiszpańską liczbę 'siedem'",
                correctAnswer: "siete",
                explanation: "Siete (7) to jedna z najważniejszych liczb w kulturze hiszpańskiej."
            },
            {
                type: 'matching',
                question: "Dopasuj liczby do ich wartości",
                matchingPairs: [
                    { spanish: "cinco", polish: "5" },
                    { spanish: "ocho", polish: "8" },
                    { spanish: "diez", polish: "10" },
                    { spanish: "cuatro", polish: "4" }
                ],
                correctAnswer: "all-matched"
            }
        ]
    },
    {
        id: 3,
        title: "Kolory",
        description: "Poznaj podstawowe kolory w języku hiszpańskim",
        progress: 0,
        questions: [
            {
                type: 'multiple-choice',
                question: "Który kolor to 'rojo'?",
                options: ["Niebieski", "Czerwony", "Zielony", "Żółty"],
                correctAnswer: "Czerwony",
                explanation: "Rojo to podstawowy kolor w hiszpańskim, oznaczający czerwony."
            },
            {
                type: 'text-input',
                question: "Wpisz hiszpańskie słowo oznaczające 'niebieski'",
                correctAnswer: "azul",
                explanation: "Azul to jeden z najważniejszych kolorów w sztuce hiszpańskiej."
            },
            {
                type: 'matching',
                question: "Dopasuj kolory do ich znaczeń",
                matchingPairs: [
                    { spanish: "verde", polish: "zielony" },
                    { spanish: "amarillo", polish: "żółty" },
                    { spanish: "negro", polish: "czarny" },
                    { spanish: "blanco", polish: "biały" }
                ],
                correctAnswer: "all-matched"
            }
        ]
    },
    {
        id: 4,
        title: "Liczby 11-20",
        description: "Podstawowe liczby w języku hiszpańskim",
        progress: 0,
        questions: [
            {
                type: 'multiple-choice',
                question: "Który kolor to 'rojo'?",
                options: ["Niebieski", "Czerwony", "Zielony", "Żółty"],
                correctAnswer: "Czerwony",
                explanation: "Rojo to podstawowy kolor w hiszpańskim, oznaczający czerwony."
            }
        ]
    }
];

const Lessons = () => {
    const [lessons, setLessons] = useState<Lesson[]>(lessonsData);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
    const [selectedSpanish, setSelectedSpanish] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [timerActive, setTimerActive] = useState(true);
    const [canExtendTime, setCanExtendTime] = useState(true);
    const [incorrectPairs, setIncorrectPairs] = useState<{ spanish: string; polish: string } | null>(null);
    const [isAnsweredCorrectly, setIsAnsweredCorrectly] = useState(false);
    const toast = useToast();
    const [incorrectAttempts, setIncorrectAttempts] = useState<Record<string, number>>({});
    const [testStartTime, setTestStartTime] = useState<Date | null>(null);
    const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (timerActive && timeLeft > 0 && currentLesson && !showExplanation) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [timerActive, timeLeft, currentLesson, showExplanation]);

    useEffect(() => {
        if (timeLeft === 0 && timerActive) {
            handleDontKnow();
        }
    }, [timeLeft]);

    const startLesson = (lesson: Lesson) => {
        setCurrentLesson(lesson);
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
        setTestStartTime(new Date());
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

    const handleDontKnow = () => {
        if (!currentLesson) return;
        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        setTimerActive(false);
        
        toast({
            title: "Nie szkodzi!",
            description: `Prawidłowa odpowiedź to: ${
                currentQuestion.type === 'matching' 
                    ? 'Sprawdź poniższe pary'
                    : currentQuestion.correctAnswer
            }`,
            status: "info",
            duration: 3000,
            isClosable: true,
        });

        setShowExplanation(true);
        setTimeout(() => {
            setShowExplanation(false);
            setTextInput('');
            setMatchedPairs({});
            setSelectedSpanish(null);
            
            if (currentQuestionIndex + 1 < currentLesson.questions.length) {
                setCurrentQuestionIndex(prev => prev + 1);
                setTimeLeft(30);
                setTimerActive(true);
                setCanExtendTime(true);
            } else {
                const updatedLessons = lessons.map(l => {
                    if (l.id === currentLesson.id) {
                        return { ...l, progress: 100 };
                    }
                    return l;
                });
                setLessons(updatedLessons);
                setCurrentLesson(null);
            }
        }, 3000);
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
        onOpen(); // Show statistics modal
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

        setShowExplanation(true);
        setTimeout(() => {
            setShowExplanation(false);
            setTextInput('');
            setMatchedPairs({});
            setSelectedSpanish(null);
            setIsAnsweredCorrectly(false);
            
            if (currentQuestionIndex + 1 < currentLesson.questions.length) {
                setCurrentQuestionIndex(prev => prev + 1);
                setTimeLeft(30);
                setTimerActive(true);
                setCanExtendTime(true);
            } else {
                const updatedLessons = lessons.map(l => {
                    if (l.id === currentLesson.id) {
                        return { ...l, progress: 100 };
                    }
                    return l;
                });
                setLessons(updatedLessons);
                finishLesson(currentLesson);
                setCurrentLesson(null);
            }
        }, 2000);
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
                    setTimerActive(false);
                    setIsAnsweredCorrectly(true);
                    toast({
                        title: "Świetnie!",
                        description: "Wszystkie pary zostały poprawnie dopasowane!",
                        status: "success",
                        duration: 2000,
                        isClosable: true,
                    });
                    
                    setShowExplanation(true);
                    setTimeout(() => {
                        setShowExplanation(false);
                        setTextInput('');
                        setMatchedPairs({});
                        setSelectedSpanish(null);
                        setIsAnsweredCorrectly(false);
                        
                        if (currentQuestionIndex + 1 < currentLesson.questions.length) {
                            setCurrentQuestionIndex(prev => prev + 1);
                            setTimeLeft(30);
                            setTimerActive(true);
                            setCanExtendTime(true);
                        } else {
                            const updatedLessons = lessons.map(l => {
                                if (l.id === currentLesson.id) {
                                    return { ...l, progress: 100 };
                                }
                                return l;
                            });
                            setLessons(updatedLessons);
                            setCurrentLesson(null);
                            toast({
                                title: "Gratulacje!",
                                description: "Ukończyłeś lekcję! Możesz być z siebie dumny!",
                                status: "success",
                                duration: 3000,
                                isClosable: true,
                            });
                        }
                    }, 2000);
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
        }
    };

    if (currentLesson) {
        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        return (
            <ScaleFade initialScale={0.9} in={true}>
                <VStack spacing={6} p={8} align="stretch" maxW="800px" mx="auto">
                    <HStack justify="space-between" align="center">
                        <Heading size="lg">{currentLesson.title}</Heading>
                        <Text>
                            Pytanie {currentQuestionIndex + 1} z {currentLesson.questions.length}
                        </Text>
                    </HStack>
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
                                        isDisabled={!canExtendTime}
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
                        </VStack>
                    </Box>
                </VStack>
            </ScaleFade>
        );
    }

    return (
        <VStack spacing={8} p={8} align="stretch" maxW="1200px" mx="auto">
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