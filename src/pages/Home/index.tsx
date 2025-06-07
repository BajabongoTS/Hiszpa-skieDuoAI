import { Box, VStack, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, useColorModeValue, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';
import { loadFromLocalStorage } from '../../utils/localStorage';
import type { Lesson, TestResult } from '../../types';

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

        return {
            totalLessons,
            completedLessons,
            averageProgress: Math.round(averageProgress),
            averageScore
        };
    };

    const stats = calculateStats();

    return (
        <Box p={8} maxW="1200px" mx="auto">
            <VStack spacing={8} align="stretch">
                <Heading>Panel główny</Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Stat>
                            <StatLabel>Postęp</StatLabel>
                            <StatNumber>{stats.averageProgress}%</StatNumber>
                            <StatHelpText>Średni postęp ze wszystkich lekcji</StatHelpText>
                        </Stat>
                    </Box>

                    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Stat>
                            <StatLabel>Ukończone lekcje</StatLabel>
                            <StatNumber>{stats.completedLessons}</StatNumber>
                            <StatHelpText>z {stats.totalLessons} lekcji</StatHelpText>
                        </Stat>
                    </Box>

                    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Stat>
                            <StatLabel>Średni wynik</StatLabel>
                            <StatNumber>{stats.averageScore}%</StatNumber>
                            <StatHelpText>ze wszystkich testów</StatHelpText>
                        </Stat>
                    </Box>

                    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Stat>
                            <StatLabel>Dzisiejsza aktywność</StatLabel>
                            <StatNumber>
                                {loadFromLocalStorage<number>('todayLessons', 0)}
                            </StatNumber>
                            <StatHelpText>Ukończonych lekcji</StatHelpText>
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
                                    {testResults.slice(0, 5).map((result, index) => (
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