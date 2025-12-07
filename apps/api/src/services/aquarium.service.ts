import { PrismaClient, Aquarium } from '@prisma/client';
import { CreateAquariumDto } from '../types/shared';

const prisma = new PrismaClient();

export class AquariumService {
  async findByUserId(userId: string): Promise<Aquarium[]> {
    return prisma.aquarium.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Aquarium | null> {
    return prisma.aquarium.findUnique({
      where: { id },
    });
  }

  async create(userId: string, data: CreateAquariumDto): Promise<Aquarium> {
    return prisma.aquarium.create({
      data: {
        name: data.name,
        type: data.type,
        volume: data.volume,
        description: data.description || null,
        userId,
      },
    });
  }

  async update(id: string, data: Partial<CreateAquariumDto>): Promise<Aquarium> {
    return prisma.aquarium.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Aquarium> {
    return prisma.aquarium.delete({
      where: { id },
    });
  }
}

export const aquariumService = new AquariumService();
