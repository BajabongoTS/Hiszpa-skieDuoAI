import { Box, VStack, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, useColorModeValue, Table, Thead, Tbody, Tr, Th, Td, Progress, Text, HStack, Icon } from '@chakra-ui/react';
import { loadFromLocalStorage } from '../../utils/localStorage';
import type { Lesson, TestResult } from '../../types';
import { FaTrophy, FaGraduationCap, FaClock, FaCalendarCheck } from 'react-icons/fa';

const Home = () => {
    const lessonsData = loadFromLocalStorage<Lesson[]>('lessons', []);
    const testResults = loadFromLocalStorage<TestResult[]>('testResults', []);
    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const calculateStats = () => {
        const totalLessons = lessonsData.length;
        const completedLessons = lessonsData.filter((lesson: Lesson) => lesson.progress === 100).length;
        const averageProgress = lessonsData.reduce((acc: number, lesson: Lesson) => acc + lesson.progress, 0) / totalLessons;

        // Calculate average score from test results
        const averageScore = testResults.length > 0
            ? Math.round(testResults.reduce((acc, result) => 
                acc + (result.correctAnswers / result.totalQuestions) * 100, 0) / testResults.length)
            : 0;

        // Calculate total learning time
        const totalTime = testResults.reduce((acc, result) => acc + result.timeSpent, 0);

        return {
            totalLessons,
            completedLessons,
            averageProgress: Math.round(averageProgress),
            averageScore,
            totalTime
        };
    };

    const stats = calculateStats();

    return (
        <Box p={8} maxW="1200px" mx="auto">
            <VStack spacing={8} align="stretch">
                <Box>
                    <Heading mb={2}>Panel główny</Heading>
                    <Text color="gray.600" _dark={{ color: 'gray.300' }}>
                        Witaj w HiszpańskiDuo! Oto Twój postęp w nauce.
                    </Text>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Stat>
                            <HStack spacing={2}>
                                <Icon as={FaGraduationCap} color="teal.500" />
                                <StatLabel>Postęp nauki</StatLabel>
                            </HStack>
                            <StatNumber>{stats.averageProgress}%</StatNumber>
                            <Progress value={stats.averageProgress} colorScheme="teal" size="sm" mt={2} />
                            <StatHelpText>Średni postęp ze wszystkich lekcji</StatHelpText>
                        </Stat>
                    </Box>

                    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Stat>
                            <HStack spacing={2}>
                                <Icon as={FaTrophy} color="yellow.500" />
                                <StatLabel>Średni wynik</StatLabel>
                            </HStack>
                            <StatNumber>{stats.averageScore}%</StatNumber>
                            <Progress value={stats.averageScore} colorScheme="yellow" size="sm" mt={2} />
                            <StatHelpText>ze wszystkich testów</StatHelpText>
                        </Stat>
                    </Box>

                    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Stat>
                            <HStack spacing={2}>
                                <Icon as={FaClock} color="blue.500" />
                                <StatLabel>Czas nauki</StatLabel>
                            </HStack>
                            <StatNumber>{Math.round(stats.totalTime / 60)} min</StatNumber>
                            <StatHelpText>{stats.totalTime} sekund łącznie</StatHelpText>
                        </Stat>
                    </Box>

                    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Stat>
                            <HStack spacing={2}>
                                <Icon as={FaCalendarCheck} color="green.500" />
                                <StatLabel>Dzisiejsza aktywność</StatLabel>
                            </HStack>
                            <StatNumber>
                                {loadFromLocalStorage<number>('todayLessons', 0)}
                            </StatNumber>
                            <StatHelpText>ukończonych lekcji</StatHelpText>
                        </Stat>
                    </Box>
                </SimpleGrid>

                {testResults.length > 0 && (
                    <Box>
                        <Heading size="md" mb={4}>Ostatnie wyniki</Heading>
                        <Box overflowX="auto">
                            <Table variant="simple">
                                <Thead>
                                    <Tr>
                                        <Th>Lekcja</Th>
                                        <Th isNumeric>Wynik</Th>
                                        <Th isNumeric>Czas (s)</Th>
                                        <Th>Data</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {testResults.slice(0, 3).map((result, index) => (
                                        <Tr key={index}>
                                            <Td>{result.lessonTitle}</Td>
                                            <Td isNumeric>
                                                {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
                                            </Td>
                                            <Td isNumeric>{result.timeSpent}</Td>
                                            <Td>{new Date(result.completedAt).toLocaleString()}</Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </Box>
                    </Box>
                )}
            </VStack>
        </Box>
    );
};

export default Home; 