import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  VStack,
  Text,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  Select,
  Textarea,
  Grid,
  Badge,
  Spinner,
  Center,
  Image,
} from '@chakra-ui/react';
import { DeleteIcon, AttachmentIcon } from '@chakra-ui/icons';
import { useAquariums } from '../hooks/useAquariums';
import { useEquipment } from '../hooks/useEquipment';
import { useCorals } from '../hooks/useCorals';
import type { Aquarium, Equipment, Coral, CreateEquipmentDto, CreateCoralDto } from '../types/shared';
import { Navbar } from './Navbar';

export const AquariumDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [aquarium, setAquarium] = useState<Aquarium | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [corals, setCorals] = useState<Coral[]>([]);
  const [loading, setLoading] = useState(true);

  const { getAquarium } = useAquariums();
  const { getEquipment, createEquipment, deleteEquipment } = useEquipment(id || '');
  const { getCorals, createCoral, deleteCoral, uploadCoralPhoto, deleteCoralPhoto } = useCorals(id || '');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCoralId, setUploadingCoralId] = useState<string | null>(null);

  const {
    isOpen: isEquipmentOpen,
    onOpen: onEquipmentOpen,
    onClose: onEquipmentClose,
  } = useDisclosure();
  const { isOpen: isCoralOpen, onOpen: onCoralOpen, onClose: onCoralClose } = useDisclosure();

  const [newEquipment, setNewEquipment] = useState<CreateEquipmentDto>({
    name: '',
    type: 'filter',
    brand: '',
    notes: '',
  });

  const [newCoral, setNewCoral] = useState<CreateCoralDto>({
    species: '',
    placement: '',
    color: '',
    size: '',
    source: '',
    notes: '',
  });
  const [coralPhoto, setCoralPhoto] = useState<File | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [aquariumData, equipmentData, coralData] = await Promise.all([
          getAquarium(id),
          getEquipment(),
          getCorals(),
        ]);
        setAquarium(aquariumData);
        setEquipment(equipmentData);
        setCorals(coralData);
      } catch (error) {
        console.error('Failed to fetch aquarium data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createEquipment(newEquipment);
      setEquipment([created, ...equipment]);
      onEquipmentClose();
      setNewEquipment({ name: '', type: 'filter', brand: '', notes: '' });
    } catch (error) {
      console.error('Failed to create equipment:', error);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    try {
      await deleteEquipment(equipmentId);
      setEquipment(equipment.filter((e) => e.id !== equipmentId));
    } catch (error) {
      console.error('Failed to delete equipment:', error);
    }
  };

  const handleCreateCoral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let created = await createCoral(newCoral);
      if (coralPhoto) {
        created = await uploadCoralPhoto(created.id, coralPhoto);
      }
      setCorals([created, ...corals]);
      onCoralClose();
      setNewCoral({ species: '', placement: '', color: '', size: '', source: '', notes: '' });
      setCoralPhoto(null);
    } catch (error) {
      console.error('Failed to create coral:', error);
    }
  };

  const handlePhotoUpload = async (coralId: string, file: File) => {
    try {
      setUploadingCoralId(coralId);
      const updated = await uploadCoralPhoto(coralId, file);
      setCorals(corals.map((c) => (c.id === coralId ? updated : c)));
    } catch (error) {
      console.error('Failed to upload photo:', error);
    } finally {
      setUploadingCoralId(null);
    }
  };

  const handleDeletePhoto = async (coralId: string) => {
    try {
      await deleteCoralPhoto(coralId);
      setCorals(corals.map((c) => (c.id === coralId ? { ...c, imageUrl: undefined } : c)));
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  const handleDeleteCoral = async (coralId: string) => {
    try {
      await deleteCoral(coralId);
      setCorals(corals.filter((c) => c.id !== coralId));
    } catch (error) {
      console.error('Failed to delete coral:', error);
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="ocean.500" thickness="4px" />
          <Text fontSize="lg" color="gray.600">
            Loading aquarium...
          </Text>
        </VStack>
      </Center>
    );
  }

  if (!aquarium) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Aquarium not found</Text>
        <Button onClick={() => navigate('/')} mt={4}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Card bg="white">
            <CardHeader>
              <VStack align="start" spacing={2}>
                <Heading size="xl">{aquarium.name}</Heading>
                <HStack>
                  <Badge variant={aquarium.type} fontSize="md" px={3} py={1}>
                    {aquarium.type}
                  </Badge>
                  <Text color="gray.600" fontSize="lg">
                    {aquarium.volume} gallons
                  </Text>
                </HStack>
                {aquarium.description && (
                  <Text color="gray.600" mt={2}>
                    {aquarium.description}
                  </Text>
                )}
              </VStack>
            </CardHeader>
          </Card>

          {/* Equipment Section */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Heading size="md">Equipment</Heading>
            <Button onClick={onEquipmentOpen} colorScheme="ocean" size="sm">
              + Add Equipment
            </Button>
          </HStack>

          {equipment.length === 0 ? (
            <Text color="gray.500">No equipment added yet</Text>
          ) : (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
              {equipment.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">{item.name}</Text>
                        <Badge colorScheme="blue">{item.type}</Badge>
                      </VStack>
                      <IconButton
                        aria-label="Delete equipment"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDeleteEquipment(item.id)}
                      />
                    </HStack>
                  </CardHeader>
                  {(item.brand || item.notes) && (
                    <CardBody pt={0}>
                      {item.brand && (
                        <Text fontSize="sm" color="gray.600">
                          Brand: {item.brand}
                        </Text>
                      )}
                      {item.notes && (
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          {item.notes}
                        </Text>
                      )}
                    </CardBody>
                  )}
                </Card>
              ))}
            </Grid>
          )}
        </Box>

        {/* Coral Section */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Heading size="md">Coral Collection</Heading>
            <Button onClick={onCoralOpen} colorScheme="ocean" size="sm">
              + Add Coral
            </Button>
          </HStack>

          {corals.length === 0 ? (
            <Text color="gray.500">No corals added yet</Text>
          ) : (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
              {corals.map((coral) => (
                <Card key={coral.id} overflow="hidden">
                  <Box position="relative">
                    {coral.imageUrl ? (
                      <Image
                        src={coral.imageUrl}
                        alt={coral.species}
                        h="160px"
                        w="100%"
                        objectFit="cover"
                      />
                    ) : (
                      <Box
                        h="80px"
                        bgGradient="linear(to-br, purple.400, ocean.600)"
                      />
                    )}
                    <HStack position="absolute" top={2} right={2} spacing={1}>
                      {coral.imageUrl && (
                        <IconButton
                          aria-label="Delete photo"
                          icon={<DeleteIcon />}
                          size="xs"
                          colorScheme="red"
                          onClick={() => handleDeletePhoto(coral.id)}
                        />
                      )}
                      <IconButton
                        aria-label="Upload photo"
                        icon={uploadingCoralId === coral.id ? <Spinner size="xs" /> : <AttachmentIcon />}
                        size="xs"
                        colorScheme="ocean"
                        isDisabled={uploadingCoralId === coral.id}
                        onClick={() => {
                          setUploadingCoralId(coral.id);
                          photoInputRef.current?.click();
                        }}
                      />
                    </HStack>
                  </Box>
                  <CardHeader>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">{coral.species}</Text>
                        {coral.color && <Badge colorScheme="purple">{coral.color}</Badge>}
                      </VStack>
                      <IconButton
                        aria-label="Delete coral"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDeleteCoral(coral.id)}
                      />
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    {coral.placement && (
                      <Text fontSize="sm" color="gray.600">
                        Placement: {coral.placement}
                      </Text>
                    )}
                    {coral.size && (
                      <Text fontSize="sm" color="gray.600">
                        Size: {coral.size}
                      </Text>
                    )}
                    {coral.source && (
                      <Text fontSize="sm" color="gray.600">
                        Source: {coral.source}
                      </Text>
                    )}
                    {coral.notes && (
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        {coral.notes}
                      </Text>
                    )}
                  </CardBody>
                </Card>
              ))}
            </Grid>
          )}
        </Box>
        </VStack>
      </Container>

      {/* Hidden file input for coral photo uploads */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingCoralId) {
            handlePhotoUpload(uploadingCoralId, file);
          }
          e.target.value = '';
        }}
      />

      {/* Add Equipment Modal */}
      <Modal isOpen={isEquipmentOpen} onClose={onEquipmentClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Equipment</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleCreateEquipment}>
              <VStack spacing={4}>
                <Input
                  placeholder="Equipment Name"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                  required
                />
                <Select
                  value={newEquipment.type}
                  onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
                  required
                >
                  <option value="filter">Filter</option>
                  <option value="pump">Pump</option>
                  <option value="light">Light</option>
                  <option value="heater">Heater</option>
                  <option value="skimmer">Skimmer</option>
                  <option value="wavemaker">Wavemaker</option>
                  <option value="other">Other</option>
                </Select>
                <Input
                  placeholder="Brand (optional)"
                  value={newEquipment.brand}
                  onChange={(e) => setNewEquipment({ ...newEquipment, brand: e.target.value })}
                />
                <Textarea
                  placeholder="Notes (optional)"
                  value={newEquipment.notes}
                  onChange={(e) => setNewEquipment({ ...newEquipment, notes: e.target.value })}
                  resize="vertical"
                />
                <Button type="submit" colorScheme="ocean" w="full">
                  Add Equipment
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Add Coral Modal */}
      <Modal isOpen={isCoralOpen} onClose={onCoralClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Coral</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleCreateCoral}>
              <VStack spacing={4}>
                <Input
                  placeholder="Species Name"
                  value={newCoral.species}
                  onChange={(e) => setNewCoral({ ...newCoral, species: e.target.value })}
                  required
                />
                <Input
                  placeholder="Placement (optional)"
                  value={newCoral.placement}
                  onChange={(e) => setNewCoral({ ...newCoral, placement: e.target.value })}
                />
                <Input
                  placeholder="Color (optional)"
                  value={newCoral.color}
                  onChange={(e) => setNewCoral({ ...newCoral, color: e.target.value })}
                />
                <Input
                  placeholder="Size (optional)"
                  value={newCoral.size}
                  onChange={(e) => setNewCoral({ ...newCoral, size: e.target.value })}
                />
                <Input
                  placeholder="Source (optional)"
                  value={newCoral.source}
                  onChange={(e) => setNewCoral({ ...newCoral, source: e.target.value })}
                />
                <Textarea
                  placeholder="Notes (optional)"
                  value={newCoral.notes}
                  onChange={(e) => setNewCoral({ ...newCoral, notes: e.target.value })}
                  resize="vertical"
                />
                <Box w="full">
                  <Text fontSize="sm" mb={1} color="gray.600">Photo (optional)</Text>
                  <input
                    type="file"
                    accept="image/*"
                    id="coral-photo-input"
                    style={{ display: 'none' }}
                    onChange={(e) => setCoralPhoto(e.target.files?.[0] || null)}
                  />
                  <Button
                    as="label"
                    htmlFor="coral-photo-input"
                    variant="outline"
                    w="full"
                    cursor="pointer"
                    leftIcon={<AttachmentIcon />}
                  >
                    {coralPhoto ? coralPhoto.name : 'Choose Photo'}
                  </Button>
                </Box>
                <Button type="submit" colorScheme="ocean" w="full">
                  Add Coral
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};
