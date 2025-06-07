import { Box, VStack, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, useColorModeValue } from '@chakra-ui/react';
import { loadFromLocalStorage } from '../../utils/localStorage';
import type { Lesson } from '../../types';

const Home = () => {
    const lessonsData = loadFromLocalStorage<Lesson[]>('lessons', []);
    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const calculateStats = () => {
        const totalLessons = lessonsData.length;
        const completedLessons = lessonsData.filter((lesson: Lesson) => lesson.progress === 100).length;
        const averageProgress = lessonsData.reduce((acc: number, lesson: Lesson) => acc + lesson.progress, 0) / totalLessons;

        return {
            totalLessons,
            completedLessons,
            averageProgress: Math.round(averageProgress)
        };
    };

    const stats = calculateStats();

    return (
        <Box p={8} maxW="1200px" mx="auto">
            <VStack spacing={8} align="stretch">
                <Heading>Panel główny</Heading>
                <Text fontSize="lg" color="gray.600" _dark={{ color: 'gray.300' }}>
                    Witaj w HiszpańskiDuo! Sprawdź swój postęp w nauce.
                </Text>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Stat>
                            <StatLabel>Ukończone lekcje</StatLabel>
                            <StatNumber>{stats.completedLessons}/{stats.totalLessons}</StatNumber>
                            <StatHelpText>
                                {Math.round((stats.completedLessons / stats.totalLessons) * 100)}% ukończonych
                            </StatHelpText>
                        </Stat>
                    </Box>

                    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Stat>
                            <StatLabel>Średni postęp</StatLabel>
                            <StatNumber>{stats.averageProgress}%</StatNumber>
                            <StatHelpText>
                                Wszystkich lekcji
                            </StatHelpText>
                        </Stat>
                    </Box>

                    <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                        <Stat>
                            <StatLabel>Dzisiejsza aktywność</StatLabel>
                            <StatNumber>
                                {loadFromLocalStorage<number>('todayLessons', 0)}
                            </StatNumber>
                            <StatHelpText>
                                Ukończonych lekcji
                            </StatHelpText>
                        </Stat>
                    </Box>
                </SimpleGrid>
            </VStack>
        </Box>
    );
};

export default Home; 