import { Box, VStack, Heading, Text, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <Box p={8} maxW="1200px" mx="auto">
            <VStack spacing={8} align="center" justify="center" minH="60vh">
                <Heading size="2xl">404</Heading>
                <Text fontSize="xl">Strona nie została znaleziona</Text>
                <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                    Przepraszamy, ale strona której szukasz nie istnieje.
                </Text>
                <Button
                    colorScheme="teal"
                    size="lg"
                    onClick={() => navigate('/')}
                >
                    Wróć do strony głównej
                </Button>
            </VStack>
        </Box>
    );
};

export default NotFound; 