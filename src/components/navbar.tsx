import { Box, Flex, IconButton, useColorMode, Heading, Menu, MenuButton, MenuList, MenuItem, HStack, Button } from '@chakra-ui/react';
import { FaSun, FaMoon, FaCog, FaHome, FaBook, FaChartBar } from 'react-icons/fa';
import { BiCard } from 'react-icons/bi';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();

  const handleTitleClick = () => {
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box 
      as="nav" 
      bg="teal.500" 
      px={4} 
      py={3} 
      position="sticky" 
      top={0} 
      zIndex={1}
      boxShadow="md"
    >
      <Flex align="center" justify="space-between" maxW="1200px" mx="auto">
        <Flex align="center">
        <Heading 
          size="md" 
          color="white" 
          cursor="pointer"
          _hover={{ opacity: 0.8 }}
          transition="opacity 0.2s"
          onClick={handleTitleClick}
            mr={8}
        >
          HiszpańskiDuo
        </Heading>

          <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
            <Button
              leftIcon={<FaHome />}
              variant={isActive('/') ? 'solid' : 'ghost'}
              color="white"
              onClick={() => navigate('/')}
              _hover={{ bg: 'teal.600' }}
            >
              Start
            </Button>
            <Button
              leftIcon={<FaBook />}
              variant={isActive('/lessons') ? 'solid' : 'ghost'}
              color="white"
              onClick={() => navigate('/lessons')}
              _hover={{ bg: 'teal.600' }}
            >
              Lekcje
            </Button>
            <Button
              leftIcon={<BiCard />}
              variant={isActive('/flashcards') ? 'solid' : 'ghost'}
              color="white"
              onClick={() => navigate('/flashcards')}
              _hover={{ bg: 'teal.600' }}
            >
              Fiszki
            </Button>
            <Button
              leftIcon={<FaChartBar />}
              variant={isActive('/statistics') ? 'solid' : 'ghost'}
              color="white"
              onClick={() => navigate('/statistics')}
              _hover={{ bg: 'teal.600' }}
            >
              Statystyki
            </Button>
          </HStack>
        </Flex>

        <Flex gap={2}>
          <IconButton
            aria-label="Toggle dark mode"
            icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
            onClick={toggleColorMode}
            variant="ghost"
            color="white"
            _hover={{ bg: 'teal.600' }}
          />
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Settings"
              icon={<FaCog />}
              variant="ghost"
              color="white"
              _hover={{ bg: 'teal.600' }}
            />
            <MenuList>
              <MenuItem onClick={() => navigate('/')}>Start</MenuItem>
              <MenuItem onClick={() => navigate('/lessons')}>Lekcje</MenuItem>
              <MenuItem onClick={() => navigate('/flashcards')}>Fiszki</MenuItem>
              <MenuItem onClick={() => navigate('/statistics')}>Statystyki</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar; 