// User type matching Prisma schema
export interface User {
  id: string;
  email: string;
  name: string | null;
  auth0Id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Equipment type matching Prisma schema
export interface Equipment {
  id: string;
  name: string;
  type: string;
  brand: string | null;
  notes: string | null;
  aquariumId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Coral type matching Prisma schema
export interface Coral {
  id: string;
  species: string;
  placement: string | null;
  color: string | null;
  size: string | null;
  acquisitionDate: Date | null;
  source: string | null;
  notes: string | null;
  imageUrl?: string | null;
  aquariumId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Aquarium type matching Prisma schema
export interface Aquarium {
  id: string;
  name: string;
  type: string;
  volume: number;
  description: string | null;
  userId: string;
  equipment?: Equipment[];
  corals?: Coral[];
  createdAt: Date;
  updatedAt: Date;
}

// API Response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User creation DTO
export interface CreateUserDto {
  email: string;
  name?: string;
  auth0Id: string;
}

// Aquarium creation DTO
export interface CreateAquariumDto {
  name: string;
  type: string;
  volume: number;
  description?: string;
}

// Equipment creation DTO
export interface CreateEquipmentDto {
  name: string;
  type: string;
  brand?: string;
  notes?: string;
}

// Coral creation DTO
export interface CreateCoralDto {
  species: string;
  placement?: string;
  color?: string;
  size?: string;
  acquisitionDate?: Date;
  source?: string;
  notes?: string;
}
