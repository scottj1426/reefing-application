import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useDisclosure,
  Image,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { useAquariums } from '../hooks/useAquariums';
import type { Aquarium, CreateAquariumDto } from '../types/shared';
import { Navbar } from './Navbar';

export const Dashboard = () => {
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();
  const navigate = useNavigate();
  const [aquariums, setAquariums] = useState<Aquarium[]>([]);
  const [newAquarium, setNewAquarium] = useState<CreateAquariumDto>({
    name: '',
    type: 'reef',
    volume: 0,
    description: '',
  });
  const { getAquariums, createAquarium, deleteAquarium } = useAquariums();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (isAuthenticated) {
      getAquariums()
        .then((aquariumData) => setAquariums(aquariumData))
        .catch((error) => console.error('Failed to fetch aquariums:', error));
    }
  }, [isAuthenticated]);

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

  const handleDeleteAquarium = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
          <Text fontSize="lg" color="gray.600">
            Loading...
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />

      {/* Main Content */}
      <Container maxW="container.xl" py={8}>
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
              <Heading size="md">Welcome, {user?.name || user?.email}!</Heading>
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
                  <Card
                    key={aquarium.id}
                    cursor="pointer"
                    onClick={() => navigate(`/aquarium/${aquarium.id}`)}
                    _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    <Box h="200px" borderTopRadius="lg" overflow="hidden">
                      {aquarium.photos?.[0]?.imageUrl ? (
                        <Image
                          src={aquarium.photos[0].imageUrl}
                          alt={aquarium.name}
                          h="200px"
                          w="100%"
                          objectFit="cover"
                        />
                      ) : (
                        <Box
                          h="200px"
                          bgGradient={
                            aquarium.type === 'reef'
                              ? 'linear(to-br, reef.400, ocean.600)'
                              : aquarium.type === 'saltwater'
                              ? 'linear(to-br, blue.400, ocean.600)'
                              : 'linear(to-br, green.400, teal.600)'
                          }
                        />
                      )}
                    </Box>

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
                          onClick={(e) => handleDeleteAquarium(aquarium.id, e)}
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
};
