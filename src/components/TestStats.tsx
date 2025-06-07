import React from 'react';
import {
    VStack,
    Text,
    Progress,
    Box,
    Heading,
    Stat,
    StatLabel,
    StatNumber,
    StatGroup,
    List,
    ListItem,
    ListIcon,
} from '@chakra-ui/react';
import { FaCheck, FaTimes } from 'react-icons/fa';

export interface TestResult {
    lessonTitle: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAttempts: Record<string, number>;
    timeSpent: number;
    completedAt: Date;
}

interface TestStatsProps {
    result: TestResult;
}

const TestStats: React.FC<TestStatsProps> = ({ result }) => {
    const percentageCorrect = Math.round((result.correctAnswers / result.totalQuestions) * 100);
    const incorrectAnswers = result.totalQuestions - result.correctAnswers;
    const averageTimePerQuestion = Math.round(result.timeSpent / result.totalQuestions);

    return (
        <VStack spacing={6} align="stretch">
            <Box>
                <Heading size="md" mb={2}>{result.lessonTitle}</Heading>
                <Text color="gray.500">
                    Ukończono: {result.completedAt.toLocaleString()}
                </Text>
            </Box>

            <Box>
                <Text mb={2}>Ogólny wynik:</Text>
                <Progress
                    value={percentageCorrect}
                    colorScheme={percentageCorrect >= 70 ? "green" : percentageCorrect >= 50 ? "yellow" : "red"}
                    size="lg"
                    borderRadius="md"
                />
                <Text mt={2} textAlign="right">{percentageCorrect}%</Text>
            </Box>

            <StatGroup>
                <Stat>
                    <StatLabel>Poprawne odpowiedzi</StatLabel>
                    <StatNumber color="green.500">{result.correctAnswers}</StatNumber>
                </Stat>
                <Stat>
                    <StatLabel>Błędne odpowiedzi</StatLabel>
                    <StatNumber color="red.500">{incorrectAnswers}</StatNumber>
                </Stat>
                <Stat>
                    <StatLabel>Czas na pytanie</StatLabel>
                    <StatNumber>{averageTimePerQuestion}s</StatNumber>
                </Stat>
            </StatGroup>

            {Object.entries(result.incorrectAttempts).length > 0 && (
                <Box>
                    <Heading size="sm" mb={3}>Pytania z błędami:</Heading>
                    <List spacing={3}>
                        {Object.entries(result.incorrectAttempts).map(([question, attempts]) => (
                            <ListItem key={question}>
                                <ListIcon as={attempts > 2 ? FaTimes : FaCheck} color={attempts > 2 ? "red.500" : "yellow.500"} />
                                {question}
                                <Text as="span" color="gray.500" ml={2}>
                                    ({attempts} {attempts === 1 ? 'próba' : attempts < 5 ? 'próby' : 'prób'})
                                </Text>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
        </VStack>
    );
};

export default TestStats; 