import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Center,
  Divider,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import axios from 'axios';
import type { Aquarium, Equipment, Coral } from '../types/shared';
import { Navbar } from './Navbar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface PublicCollectionData {
  user: {
    name: string | null;
    username: string;
  };
  aquariums: (Aquarium & {
    equipment?: Equipment[];
    corals?: Coral[];
  })[];
}

export const PublicCollection = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PublicCollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      if (!username) return;

      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/public/collection/${username}`);

        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError('Collection not found');
        }
      } catch (err) {
        console.error('Failed to fetch collection:', err);
        setError('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [username]);

  if (loading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="ocean.500" thickness="4px" />
          <Text fontSize="lg" color="gray.600">
            Loading collection...
          </Text>
        </VStack>
      </Center>
    );
  }

  if (error || !data) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Text fontSize="xl" color="red.500">
            {error || 'Collection not found'}
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

      {/* Collection */}
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="xl">{data.user.name || data.user.username}'s Collection</Heading>
            <Text color="gray.600" mt={2}>
              @{data.user.username}
            </Text>
          </Box>
        {data.aquariums.length === 0 ? (
          <Center py={16}>
            <Text fontSize="lg" color="gray.500">
              No aquariums in this collection yet
            </Text>
          </Center>
        ) : (
          <VStack spacing={8} align="stretch">
            {data.aquariums.map((aquarium) => (
              <Card key={aquarium.id} bg="white">
                <CardHeader>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Heading size="lg">{aquarium.name}</Heading>
                      <HStack>
                        <Badge colorScheme="blue">{aquarium.type}</Badge>
                        <Text color="gray.600">{aquarium.volume} gallons</Text>
                      </HStack>
                    </VStack>
                  </HStack>
                  {aquarium.description && (
                    <Text color="gray.600" mt={2}>
                      {aquarium.description}
                    </Text>
                  )}
                </CardHeader>

                <CardBody>
                  <VStack spacing={6} align="stretch">
                    {/* Equipment Section */}
                    {aquarium.equipment && aquarium.equipment.length > 0 && (
                      <Box>
                        <Heading size="md" mb={3}>
                          Equipment
                        </Heading>
                        <Grid
                          templateColumns={{
                            base: '1fr',
                            md: 'repeat(2, 1fr)',
                            lg: 'repeat(3, 1fr)',
                          }}
                          gap={3}
                        >
                          {aquarium.equipment.map((item) => (
                            <Box
                              key={item.id}
                              p={3}
                              borderWidth="1px"
                              borderRadius="md"
                              borderColor="gray.200"
                            >
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold">{item.name}</Text>
                                <Badge size="sm" colorScheme="blue">
                                  {item.type}
                                </Badge>
                                {item.brand && (
                                  <Text fontSize="sm" color="gray.600">
                                    {item.brand}
                                  </Text>
                                )}
                              </VStack>
                            </Box>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    {aquarium.equipment && aquarium.equipment.length > 0 &&
                      aquarium.corals && aquarium.corals.length > 0 && <Divider />}

                    {/* Coral Section */}
                    {aquarium.corals && aquarium.corals.length > 0 && (
                      <Box>
                        <Heading size="md" mb={3}>
                          Coral Collection ({aquarium.corals.length})
                        </Heading>
                        <Grid
                          templateColumns={{
                            base: '1fr',
                            md: 'repeat(2, 1fr)',
                            lg: 'repeat(3, 1fr)',
                          }}
                          gap={3}
                        >
                          {aquarium.corals.map((coral) => (
                            <Box
                              key={coral.id}
                              p={3}
                              borderWidth="1px"
                              borderRadius="md"
                              borderColor="gray.200"
                            >
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold">{coral.species}</Text>
                                {coral.color && (
                                  <Badge size="sm" colorScheme="purple">
                                    {coral.color}
                                  </Badge>
                                )}
                                {coral.size && (
                                  <Text fontSize="sm" color="gray.600">
                                    Size: {coral.size}
                                  </Text>
                                )}
                                {coral.placement && (
                                  <Text fontSize="sm" color="gray.600">
                                    {coral.placement}
                                  </Text>
                                )}
                              </VStack>
                            </Box>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}
        </VStack>
      </Container>
    </Box>
  );
};
