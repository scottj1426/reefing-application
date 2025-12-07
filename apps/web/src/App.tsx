import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Input,
  Select,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  IconButton,
  useColorMode,
  useDisclosure,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, DeleteIcon } from '@chakra-ui/icons';
import { useApi } from './hooks/useApi';
import { useAquariums } from './hooks/useAquariums';
import type { Aquarium, CreateAquariumDto } from './types/shared';

function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0();
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [newAquarium, setNewAquarium] = useState<CreateAquariumDto>({
    name: '',
    type: 'reef',
    volume: 0,
    description: '',
  });
  const { syncUser, getCurrentUser } = useApi();
  const { getAquariums, createAquarium, deleteAquarium } = useAquariums();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    if (isAuthenticated && user && user.email) {
      syncUser(user.email, user.name)
        .then(() => getCurrentUser())
        .then(() => getAquariums())
        .then((aquariumData) => setAquariums(aquariumData))
        .catch((error) => console.error('Failed to sync user:', error));
    }
  }, [isAuthenticated, user]);

  const handleCreateAquarium = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createAquarium(newAquarium);
      setAquariums([created, ...aquariums]);
      onClose();
      setNewAquarium({ name: '', type: 'reef', volume: 0, description: '' });
    } catch (error) {
      console.error('Failed to create aquarium:', error);
    }
  };

  const handleDeleteAquarium = async (id: string) => {
    try {
      await deleteAquarium(id);
      setAquariums(aquariums.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Failed to delete aquarium:', error);
    }
  };

  const getBadgeVariant = (type: string) => {
    if (type === 'reef') return 'reef';
    if (type === 'saltwater') return 'saltwater';
    return 'freshwater';
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="ocean.500" thickness="4px" />
          <Text fontSize="lg" color="gray.600">Loading...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box minH="100vh">
      {/* Header */}
      <Box bg={colorMode === 'dark' ? 'gray.800' : 'white'} boxShadow="sm" py={4} mb={8}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Heading size="lg" color="ocean.500">
              Reefing Application
            </Heading>
            <HStack spacing={4}>
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
                onClick={toggleColorMode}
                variant="ghost"
              />
              {isAuthenticated && (
                <Button
                  onClick={() =>
                    logout({ logoutParams: { returnTo: window.location.origin } })
                  }
                  colorScheme="red"
                  variant="outline"
                  size="sm"
                >
                  Log Out
                </Button>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl">
        {!isAuthenticated ? (
          <Center h="60vh">
            <VStack spacing={6}>
              <Heading size="xl">Welcome to Reefing</Heading>
              <Text fontSize="lg" color="gray.600">
                Manage your aquariums with ease
              </Text>
              <Button
                onClick={() => loginWithRedirect()}
                colorScheme="ocean"
                size="lg"
                px={8}
              >
                Log In
              </Button>
            </VStack>
          </Center>
        ) : (
          <VStack spacing={8} align="stretch">
            {/* Welcome Section */}
            <Flex justify="space-between" align="center">
              <Heading size="md">
                Welcome, {user?.name || user?.email}!
              </Heading>
              <Button onClick={onOpen} colorScheme="ocean" size="md">
                + Add Aquarium
              </Button>
            </Flex>

            {/* Aquariums Grid */}
            {aquariums.length === 0 ? (
              <Center py={16}>
                <VStack spacing={4}>
                  <Text fontSize="xl" color="gray.500">
                    No aquariums yet
                  </Text>
                  <Text color="gray.400">Add your first one to get started!</Text>
                </VStack>
              </Center>
            ) : (
              <Grid
                templateColumns={{
                  base: '1fr',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                }}
                gap={6}
              >
                {aquariums.map((aquarium) => (
                  <Card key={aquarium.id}>
                    {/* Gradient placeholder image */}
                    <Box
                      h="200px"
                      bgGradient={
                        aquarium.type === 'reef'
                          ? 'linear(to-br, reef.400, ocean.600)'
                          : aquarium.type === 'saltwater'
                          ? 'linear(to-br, blue.400, ocean.600)'
                          : 'linear(to-br, green.400, teal.600)'
                      }
                      borderTopRadius="lg"
                    />

                    <CardHeader>
                      <Flex justify="space-between" align="start">
                        <VStack align="start" spacing={1}>
                          <Heading size="md">{aquarium.name}</Heading>
                          <HStack>
                            <Badge variant={getBadgeVariant(aquarium.type)}>
                              {aquarium.type}
                            </Badge>
                            <Text color="gray.500" fontSize="sm">
                              {aquarium.volume}g
                            </Text>
                          </HStack>
                        </VStack>
                        <IconButton
                          aria-label="Delete aquarium"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDeleteAquarium(aquarium.id)}
                        />
                      </Flex>
                    </CardHeader>

                    {aquarium.description && (
                      <CardBody pt={0}>
                        <Text color="gray.600" fontSize="sm">
                          {aquarium.description}
                        </Text>
                      </CardBody>
                    )}
                  </Card>
                ))}
              </Grid>
            )}
          </VStack>
        )}
      </Container>

      {/* Create Aquarium Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Aquarium</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleCreateAquarium}>
              <VStack spacing={4}>
                <Input
                  placeholder="Tank Name"
                  value={newAquarium.name}
                  onChange={(e) =>
                    setNewAquarium({ ...newAquarium, name: e.target.value })
                  }
                  required
                />
                <Select
                  value={newAquarium.type}
                  onChange={(e) =>
                    setNewAquarium({ ...newAquarium, type: e.target.value })
                  }
                  required
                >
                  <option value="reef">Reef</option>
                  <option value="saltwater">Saltwater</option>
                  <option value="freshwater">Freshwater</option>
                </Select>
                <Input
                  type="number"
                  placeholder="Volume (gallons)"
                  value={newAquarium.volume || ''}
                  onChange={(e) =>
                    setNewAquarium({
                      ...newAquarium,
                      volume: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newAquarium.description}
                  onChange={(e) =>
                    setNewAquarium({ ...newAquarium, description: e.target.value })
                  }
                  resize="vertical"
                />
                <Button type="submit" colorScheme="ocean" w="full">
                  Create Aquarium
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default App;
