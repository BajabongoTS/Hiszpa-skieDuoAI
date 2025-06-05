import { Box, Flex, IconButton, useColorMode, Heading, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { FaSun, FaMoon, FaCog } from 'react-icons/fa';

const Navbar = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  const handleTitleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        <Heading 
          size="md" 
          color="white" 
          cursor="pointer"
          _hover={{ opacity: 0.8 }}
          transition="opacity 0.2s"
          onClick={handleTitleClick}
        >
          HiszpańskiDuo
        </Heading>
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
              <MenuItem>Profil</MenuItem>
              <MenuItem>Ustawienia dźwięku</MenuItem>
              <MenuItem>Preferencje nauki</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar; 