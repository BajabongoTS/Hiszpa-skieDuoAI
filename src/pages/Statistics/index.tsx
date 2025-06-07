import React from 'react';
import { Box, VStack, Heading, Text, Grid } from '@chakra-ui/react';
import type { TestResult } from '../../types';
import { getCookie } from '../../utils/cookies';

interface TopicStats {
    correct: number;
    incorrect: number;
    total: number;
}

interface StatsMap {
    [key: string]: TopicStats;
}

const Statistics: React.FC = () => {
    const testResults = getCookie('testResults') as TestResult[] || [];
    const topicStats: StatsMap = {};

    // Process test results
    testResults.forEach(result => {
        if (!topicStats[result.lessonTitle]) {
            topicStats[result.lessonTitle] = {
                correct: 0,
                incorrect: 0,
                total: 0
            };
        }

        const topic = result.lessonTitle;
        topicStats[topic].correct += result.correctAnswers;
        topicStats[topic].incorrect += result.incorrectAnswers;
        topicStats[topic].total += result.totalQuestions;

        // Add incorrect attempts
        Object.values(result.incorrectAttempts).forEach((attempts: number) => {
            topicStats[topic].incorrect += attempts;
        });
    });

    return (
        <Box p={4}>
            <VStack spacing={6} align="stretch">
                <Heading size="lg">Statystyki nauki</Heading>
                <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
                    {Object.entries(topicStats).map(([topic, stats]) => (
                        <Box key={topic} p={4} borderWidth={1} borderRadius="md">
                            <Heading size="md" mb={2}>{topic}</Heading>
                            <Text>Poprawne odpowiedzi: {stats.correct}</Text>
                            <Text>Niepoprawne odpowiedzi: {stats.incorrect}</Text>
                            <Text>Całkowita liczba pytań: {stats.total}</Text>
                            <Text fontWeight="bold" mt={2}>
                                Skuteczność: {((stats.correct / (stats.correct + stats.incorrect)) * 100).toFixed(1)}%
                            </Text>
                        </Box>
                    ))}
                </Grid>
            </VStack>
        </Box>
    );
};

export default Statistics; 