import { Box, VStack, Heading, Table, Thead, Tbody, Tr, Th, Td, Text } from '@chakra-ui/react';
import { loadFromLocalStorage } from '../../utils/localStorage';
import type { TestResult } from '../../types';

const StatisticsPage = () => {
    const testResults = loadFromLocalStorage('testResults', []) as TestResult[];

    return (
        <Box p={8} maxW="1200px" mx="auto">
            <VStack spacing={8} align="stretch">
                <Heading>Statystyki</Heading>
                
                {testResults.length > 0 ? (
                    <Box overflowX="auto">
                        <Table variant="simple">
                            <Thead>
                                <Tr>
                                    <Th>Lekcja</Th>
                                    <Th isNumeric>Poprawne odpowiedzi</Th>
                                    <Th isNumeric>Wszystkie pytania</Th>
                                    <Th isNumeric>Wynik</Th>
                                    <Th isNumeric>Czas (s)</Th>
                                    <Th>Data ukończenia</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {testResults.map((result, index) => (
                                    <Tr key={index}>
                                        <Td>{result.lessonTitle}</Td>
                                        <Td isNumeric>{result.correctAnswers}</Td>
                                        <Td isNumeric>{result.totalQuestions}</Td>
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
                ) : (
                    <Text color="gray.500">
                        Brak dostępnych statystyk. Ukończ kilka lekcji, aby zobaczyć swoje wyniki.
                    </Text>
                )}
            </VStack>
        </Box>
    );
};

export default StatisticsPage; 