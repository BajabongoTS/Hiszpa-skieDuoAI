import { Box } from '@chakra-ui/react';
import FlashcardMode from '../../components/FlashcardMode';
import { parseVocabulary } from '../../utils/vocabulary';
import { bodyPartsVocab, foodVocab, excursionVocab } from '../../data/vocabulary';

const FlashcardsPage = () => {
    return (
        <Box p={8}>
            <FlashcardMode
                vocabularies={[
                    {
                        title: "Części ciała",
                        words: parseVocabulary(bodyPartsVocab)
                    },
                    {
                        title: "Jedzenie",
                        words: parseVocabulary(foodVocab)
                    },
                    {
                        title: "Wycieczka",
                        words: parseVocabulary(excursionVocab)
                    }
                ]}
            />
        </Box>
    );
};

export default FlashcardsPage; 