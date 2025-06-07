import React from 'react';
import { Box, VStack, Heading, Text, Progress, Grid, HStack, Icon } from '@chakra-ui/react';
import { FaTimes, FaSkull } from 'react-icons/fa';

export interface TestResult {
  lessonTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAttempts: Record<string, number>; // question -> number of incorrect attempts
  timeSpent: number; // in seconds
  completedAt: Date;
}

interface TestStatsProps {
  result: TestResult;
}

const TestStats: React.FC<TestStatsProps> = ({ result }) => {
  const accuracy = (result.correctAnswers / result.totalQuestions) * 100;
  const averageTime = result.timeSpent / result.totalQuestions;
  
  // Sort questions by number of incorrect attempts
  const sortedQuestions = Object.entries(result.incorrectAttempts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5 most difficult questions

  return (
    <Box p={6} borderWidth={1} borderRadius="lg" bg="white" _dark={{ bg: 'gray.700' }} w="100%">
      <VStack spacing={6} align="stretch">
        <Heading size="md">Podsumowanie testu: {result.lessonTitle}</Heading>
        
        {/* Overall Statistics */}
        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
          <Box p={4} borderRadius="md" bg="teal.50" _dark={{ bg: 'teal.900' }}>
            <VStack>
              <Text fontSize="sm">Dokładność</Text>
              <Heading size="md">{accuracy.toFixed(1)}%</Heading>
              <Progress
                value={accuracy}
                colorScheme="teal"
                w="100%"
                borderRadius="full"
              />
            </VStack>
          </Box>
          
          <Box p={4} borderRadius="md" bg="purple.50" _dark={{ bg: 'purple.900' }}>
            <VStack>
              <Text fontSize="sm">Średni czas na pytanie</Text>
              <Heading size="md">{averageTime.toFixed(1)}s</Heading>
            </VStack>
          </Box>
          
          <Box p={4} borderRadius="md" bg="orange.50" _dark={{ bg: 'orange.900' }}>
            <VStack>
              <Text fontSize="sm">Poprawne odpowiedzi</Text>
              <Heading size="md">{result.correctAnswers}/{result.totalQuestions}</Heading>
            </VStack>
          </Box>
        </Grid>

        {/* Difficult Questions Section */}
        {sortedQuestions.length > 0 && (
          <Box>
            <Heading size="sm" mb={4}>
              <HStack>
                <Icon as={FaSkull} />
                <Text>Najtrudniejsze pytania</Text>
              </HStack>
            </Heading>
            <VStack spacing={3} align="stretch">
              {sortedQuestions.map(([question, attempts]) => (
                <Box
                  key={question}
                  p={3}
                  borderRadius="md"
                  bg="red.50"
                  _dark={{ bg: 'red.900' }}
                >
                  <HStack justify="space-between">
                    <Text fontSize="sm">{question}</Text>
                    <HStack spacing={1}>
                      <Icon as={FaTimes} color="red.500" />
                      <Text fontSize="sm" fontWeight="bold">
                        {attempts} {attempts === 1 ? 'błąd' : 'błędy'}
                      </Text>
                    </HStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>
        )}

        <Text fontSize="sm" color="gray.500" alignSelf="flex-end">
          Ukończono: {result.completedAt.toLocaleString()}
        </Text>
      </VStack>
    </Box>
  );
};

export default TestStats; 