import { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Button,
    Heading,
    Text,
    Select,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

interface Word {
    spanish: string;
    polish: string;
}

interface VocabularySet {
    title: string;
    words: Word[];
}

interface FlashcardModeProps {
    vocabularies: VocabularySet[];
}

const FlashcardMode = ({ vocabularies }: FlashcardModeProps) => {
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const currentSet = vocabularies[currentSetIndex];
    const totalCards = currentSet?.words.length || 0;
    const currentWord = currentSet?.words[currentCardIndex];

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleNext = () => {
        if (currentCardIndex < totalCards - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
        } else {
            setCurrentCardIndex(0);
        }
        setIsFlipped(false);
    };

    const handlePrevious = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(currentCardIndex - 1);
        } else {
            setCurrentCardIndex(totalCards - 1);
        }
        setIsFlipped(false);
    };

    const handleSetChange = (newIndex: number) => {
        setCurrentSetIndex(newIndex);
        setCurrentCardIndex(0);
        setIsFlipped(false);
    };

    if (!currentSet || !currentWord) {
        return (
            <VStack spacing={6} p={8} align="stretch" maxW="600px" mx="auto">
                <Heading size="lg" textAlign="center">
                    Brak dostępnych słówek
                </Heading>
                <Select
                    value={currentSetIndex}
                    onChange={(e) => handleSetChange(Number(e.target.value))}
                    size="lg"
                >
                    {vocabularies.map((set, index) => (
                        <option key={set.title} value={index}>
                            {set.title}
                        </option>
                    ))}
                </Select>
            </VStack>
        );
    }

    return (
        <VStack spacing={6} p={8} align="stretch" maxW="600px" mx="auto">
            <HStack justify="space-between" align="center">
                <Select
                    value={currentSetIndex}
                    onChange={(e) => handleSetChange(Number(e.target.value))}
                    maxW="200px"
                >
                    {vocabularies.map((set, index) => (
                        <option key={set.title} value={index}>
                            {set.title}
                        </option>
                    ))}
                </Select>
                <Text>
                    Fiszka {currentCardIndex + 1} z {totalCards}
                </Text>
            </HStack>
            
            <MotionBox
                p={8}
                bg="white"
                _dark={{ bg: 'gray.700' }}
                borderRadius="lg"
                boxShadow="lg"
                cursor="pointer"
                onClick={handleFlip}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ perspective: 1000 }}
                minH="200px"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    style={{ transform: isFlipped ? 'rotateY(180deg)' : 'none' }}
                >
                    {isFlipped ? currentWord.polish : currentWord.spanish}
                </Text>
            </MotionBox>

            <HStack spacing={4} justify="center">
                <Button
                    colorScheme="teal"
                    onClick={handlePrevious}
                    flex={1}
                >
                    Poprzednia
                </Button>
                <Button
                    colorScheme="teal"
                    onClick={handleNext}
                    flex={1}
                >
                    Następna
                </Button>
            </HStack>
        </VStack>
    );
};

export default FlashcardMode; 