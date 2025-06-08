import { ChakraProvider, Box } from '@chakra-ui/react';
import { extendTheme } from '@chakra-ui/react';
import Navbar from './components/navbar';
import Lessons from './components/Lessons';

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
      <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.800' }}>
        <Navbar />
        <Lessons />
      </Box>
    </ChakraProvider>
  );
}

export default App;
