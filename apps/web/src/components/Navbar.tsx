import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  Flex,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box bg="ocean.600" color="white" boxShadow="md">
      <Container maxW="container.xl" py={4}>
        <Flex justify="space-between" align="center">
          <HStack spacing={8}>
            <Text
              fontSize="2xl"
              fontWeight="bold"
              cursor="pointer"
              onClick={() => navigate('/')}
            >
              Reefing
            </Text>
            <HStack spacing={4}>
              <Button
                variant={isActive('/') ? 'solid' : 'ghost'}
                colorScheme={isActive('/') ? 'whiteAlpha' : undefined}
                onClick={() => navigate('/')}
                color="white"
                _hover={{ bg: 'ocean.700' }}
              >
                My Tanks
              </Button>
              <Button
                variant={isActive('/explore') ? 'solid' : 'ghost'}
                colorScheme={isActive('/explore') ? 'whiteAlpha' : undefined}
                onClick={() => navigate('/explore')}
                color="white"
                _hover={{ bg: 'ocean.700' }}
              >
                Explore
              </Button>
            </HStack>
          </HStack>

          {isAuthenticated && user && (
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                rightIcon={<ChevronDownIcon />}
                color="white"
                _hover={{ bg: 'ocean.700' }}
                _active={{ bg: 'ocean.700' }}
              >
                <HStack spacing={2}>
                  <Avatar size="sm" name={user.name} src={user.picture} />
                  <Text>{user.name}</Text>
                </HStack>
              </MenuButton>
              <MenuList color="gray.800">
                <MenuItem onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </Flex>
      </Container>
    </Box>
  );
};
