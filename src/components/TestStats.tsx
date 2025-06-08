import React from 'react';
import { Box, VStack, Heading, Text, Progress, Grid, HStack, Icon } from '@chakra-ui/react';
import { FaTrophy, FaClock, FaCheck, FaTimes } from 'react-icons/fa';

export interface TestResult {
  lessonId: number;
  lessonTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAttempts: Record<string, number>;
  timeSpent: number;
  completedAt: Date;
  score: number;
}

interface TestStatsProps {
  result: TestResult;
}

const TestStats: React.FC<TestStatsProps> = ({ result }) => {
  const accuracy = (result.correctAnswers / result.totalQuestions) * 100;
  const averageTime = result.timeSpent / result.totalQuestions;
  
  return (
    <Box p={6} borderWidth={1} borderRadius="lg" bg="white" _dark={{ bg: 'gray.700' }} w="100%">
      <VStack spacing={6} align="stretch">
        <Heading size="md">Podsumowanie testu: {result.lessonTitle}</Heading>
        
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          <Box p={4} borderRadius="md" bg="teal.50" _dark={{ bg: 'teal.900' }}>
            <VStack>
              <HStack spacing={2}>
                <Icon as={FaTrophy} color="teal.500" />
                <Text fontSize="sm">Wynik</Text>
              </HStack>
              <Heading size="md">{result.score}%</Heading>
              <Progress
                value={result.score}
                colorScheme="teal"
                w="100%"
                borderRadius="full"
              />
            </VStack>
          </Box>
          
          <Box p={4} borderRadius="md" bg="purple.50" _dark={{ bg: 'purple.900' }}>
            <VStack>
              <HStack spacing={2}>
                <Icon as={FaClock} color="purple.500" />
                <Text fontSize="sm">Całkowity czas</Text>
              </HStack>
              <Heading size="md">{result.timeSpent}s</Heading>
              <Text fontSize="xs" color="gray.600" _dark={{ color: 'gray.300' }}>
                ({averageTime.toFixed(1)}s na pytanie)
              </Text>
            </VStack>
          </Box>
        </Grid>

        <Box p={4} borderRadius="md" bg="gray.50" _dark={{ bg: 'gray.800' }}>
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm">Poprawne odpowiedzi</Text>
              <HStack>
                <Icon as={FaCheck} color="green.500" />
                <Text fontWeight="bold">{result.correctAnswers}/{result.totalQuestions}</Text>
              </HStack>
            </HStack>
            
            <HStack justify="space-between">
              <Text fontSize="sm">Błędne próby</Text>
              <HStack>
                <Icon as={FaTimes} color="red.500" />
                <Text fontWeight="bold">
                  {Object.values(result.incorrectAttempts).reduce((sum, count) => sum + count, 0)}
                </Text>
              </HStack>
            </HStack>
            
            <Progress
              value={accuracy}
              colorScheme={accuracy >= 70 ? "green" : accuracy >= 40 ? "yellow" : "red"}
              size="sm"
              borderRadius="full"
            />
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default TestStats; 