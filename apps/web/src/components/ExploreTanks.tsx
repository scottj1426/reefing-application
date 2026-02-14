import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  Grid,
  Card,
  CardHeader,
  CardBody,
  Badge,
  HStack,
  Spinner,
  Center
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import axios from 'axios';
import type { Aquarium, Equipment, Coral } from '../types/shared';
import { Navbar } from './Navbar';

const API_URL = import.meta.env.VITE_API_URL || '';

interface AquariumWithUser extends Aquarium {
  equipment?: Equipment[];
  corals?: Coral[];
  user?: {
    name: string | null;
    username: string | null;
  };
}

export const ExploreTanks = () => {
  const navigate = useNavigate();
  const [aquariums, setAquariums] = useState<AquariumWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAquariums = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/public/explore`);

        if (response.data.success) {
          setAquariums(response.data.data);
        } else {
          setError('Failed to load aquariums');
        }
      } catch (err) {
        console.error('Failed to fetch aquariums:', err);
        setError('Failed to load aquariums');
      } finally {
        setLoading(false);
      }
    };

    fetchAquariums();
  }, []);

  if (loading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="ocean.500" thickness="4px" />
          <Text fontSize="lg" color="gray.600">
            Loading aquariums...
          </Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Text fontSize="xl" color="red.500">
            {error}
          </Text>
          <Button onClick={() => navigate('/')} leftIcon={<ArrowBackIcon />}>
            Back to Home
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />

      {/* Aquariums Grid */}
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="xl">Explore Tanks</Heading>
            <Text color="gray.600" mt={2}>
              Browse aquariums from the community
            </Text>
          </Box>
        {aquariums.length === 0 ? (
          <Center py={16}>
            <Text fontSize="lg" color="gray.500">
              No public aquariums yet
            </Text>
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
                bg="white"
                cursor="pointer"
                onClick={() => aquarium.user?.username && navigate(`/collection/${aquarium.user.username}`)}
                _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
                transition="all 0.2s"
              >
                {/* Gradient placeholder */}
                <Box
                  h="160px"
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
                  <VStack align="start" spacing={2}>
                    <Heading size="md">{aquarium.name}</Heading>
                    <HStack spacing={2}>
                      <Badge colorScheme="blue">{aquarium.type}</Badge>
                      <Text color="gray.600" fontSize="sm">
                        {aquarium.volume}g
                      </Text>
                    </HStack>
                    {aquarium.user?.username && (
                      <Text color="ocean.500" fontSize="sm" fontWeight="medium">
                        @{aquarium.user.username}
                      </Text>
                    )}
                  </VStack>
                </CardHeader>

                <CardBody pt={0}>
                  <VStack align="start" spacing={2}>
                    {aquarium.description && (
                      <Text color="gray.600" fontSize="sm" noOfLines={2}>
                        {aquarium.description}
                      </Text>
                    )}
                    <HStack spacing={4} fontSize="sm" color="gray.600">
                      {aquarium.equipment && aquarium.equipment.length > 0 && (
                        <Text>
                          {aquarium.equipment.length} equipment
                        </Text>
                      )}
                      {aquarium.corals && aquarium.corals.length > 0 && (
                        <Text>
                          {aquarium.corals.length} corals
                        </Text>
                      )}
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        )}
        </VStack>
      </Container>
    </Box>
  );
};
