import { ChakraProvider, Box } from '@chakra-ui/react';
import { extendTheme } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar';
import Home from './pages/Home';
import LessonsPage from './pages/Lessons';
import FlashcardsPage from './pages/Flashcards';
import StatisticsPage from './pages/Statistics';
import NotFound from './pages/NotFound';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      primary: 'teal.500',
      hover: 'teal.600',
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'teal',
      },
    },
    Progress: {
      defaultProps: {
        colorScheme: 'teal',
      },
    },
  },
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router basename="/">
      <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.800' }}>
        <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lessons" element={<LessonsPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
      </Box>
      </Router>
    </ChakraProvider>
  );
}

export default App;
