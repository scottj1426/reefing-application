import { PrismaClient, Aquarium } from '@prisma/client';
import { CreateAquariumDto } from '../types/shared';

const prisma = new PrismaClient();

export class AquariumService {
  async findByUserId(userId: string, includeRelations = false): Promise<Aquarium[]> {
    return prisma.aquarium.findMany({
      where: { userId },
      include: includeRelations
        ? {
            equipment: true,
            corals: true,
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, includeRelations = false): Promise<Aquarium | null> {
    return prisma.aquarium.findUnique({
      where: { id },
      include: includeRelations
        ? {
            equipment: true,
            corals: true,
          }
        : undefined,
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
