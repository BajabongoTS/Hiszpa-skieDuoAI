import { Box, VStack, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, useColorModeValue, Table, Thead, Tbody, Tr, Th, Td, Tabs, TabList, TabPanels, TabPanel, Tab, Progress, HStack, Icon } from '@chakra-ui/react';
import { loadFromLocalStorage } from '../../utils/localStorage';
import type { TestResult } from '../../types';
import { FaTrophy, FaClock, FaChartLine } from 'react-icons/fa';

const StatisticsPage = () => {
    const testResults = loadFromLocalStorage<TestResult[]>('testResults', []);
    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const calculateOverallStats = () => {
        if (testResults.length === 0) return { averageScore: 0, totalTime: 0, completedLessons: 0 };

        const totalScore = testResults.reduce((acc, result) => 
            acc + (result.correctAnswers / result.totalQuestions) * 100, 0);
        const totalTime = testResults.reduce((acc, result) => acc + result.timeSpent, 0);

        return {
            averageScore: Math.round(totalScore / testResults.length),
            totalTime,
            completedLessons: testResults.length
        };
    };

    const stats = calculateOverallStats();

    const getMostChallengingTopics = () => {
        const topicStats: Record<string, { total: number; incorrect: number }> = {};

        testResults.forEach(result => {
            Object.entries(result.incorrectAttempts).forEach(([_, attempts]) => {
                const topic = result.lessonTitle;
                if (!topicStats[topic]) {
                    topicStats[topic] = { total: 0, incorrect: 0 };
                }
                topicStats[topic].total++;
                topicStats[topic].incorrect += attempts;
            });
        });

        return Object.entries(topicStats)
            .map(([topic, stats]) => ({
                topic,
                errorRate: (stats.incorrect / stats.total) * 100
            }))
            .sort((a, b) => b.errorRate - a.errorRate)
            .slice(0, 5);
    };

    return (
        <Box p={8} maxW="1200px" mx="auto">
            <VStack spacing={8} align="stretch">
                <Heading>Statystyki nauki</Heading>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Stat>
                            <HStack spacing={2}>
                                <Icon as={FaTrophy} color="yellow.500" />
                                <StatLabel>Średni wynik</StatLabel>
                            </HStack>
                            <StatNumber>{stats.averageScore}%</StatNumber>
                            <StatHelpText>ze wszystkich lekcji</StatHelpText>
                        </Stat>
                    </Box>

                    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Stat>
                            <HStack spacing={2}>
                                <Icon as={FaClock} color="blue.500" />
                                <StatLabel>Całkowity czas nauki</StatLabel>
                            </HStack>
                            <StatNumber>{Math.round(stats.totalTime / 60)} min</StatNumber>
                            <StatHelpText>{stats.totalTime} sekund</StatHelpText>
                        </Stat>
                    </Box>

                    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Stat>
                            <HStack spacing={2}>
                                <Icon as={FaChartLine} color="green.500" />
                                <StatLabel>Ukończone lekcje</StatLabel>
                            </HStack>
                            <StatNumber>{stats.completedLessons}</StatNumber>
                            <StatHelpText>wszystkich lekcji</StatHelpText>
                        </Stat>
                    </Box>
                </SimpleGrid>

                <Tabs variant="enclosed">
                    <TabList>
                        <Tab>Historia lekcji</Tab>
                        <Tab>Najtrudniejsze tematy</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <Box overflowX="auto">
                                <Table variant="simple">
                                    <Thead>
                                        <Tr>
                                            <Th>Lekcja</Th>
                                            <Th isNumeric>Wynik</Th>
                                            <Th isNumeric>Poprawne</Th>
                                            <Th isNumeric>Całkowite</Th>
                                            <Th isNumeric>Czas (s)</Th>
                                            <Th>Data</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {testResults.map((result, index) => (
                                            <Tr key={index}>
                                                <Td>{result.lessonTitle}</Td>
                                                <Td isNumeric>
                                                    {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
                                                </Td>
                                                <Td isNumeric>{result.correctAnswers}</Td>
                                                <Td isNumeric>{result.totalQuestions}</Td>
                                                <Td isNumeric>{result.timeSpent}</Td>
                                                <Td>{new Date(result.completedAt).toLocaleString()}</Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>
                        </TabPanel>

                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                {getMostChallengingTopics().map((topic, index) => (
                                    <Box key={index} p={4} bg={bgColor} borderRadius="md" borderWidth="1px">
                                        <Text mb={2}>{topic.topic}</Text>
                                        <Progress 
                                            value={topic.errorRate} 
                                            colorScheme="red" 
                                            size="sm"
                                        />
                                        <Text fontSize="sm" color="gray.500" mt={1}>
                                            {Math.round(topic.errorRate)}% błędów
                                        </Text>
                                    </Box>
                                ))}
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>
        </Box>
    );
};

export default StatisticsPage; 