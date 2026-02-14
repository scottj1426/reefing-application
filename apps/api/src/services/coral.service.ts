import { PrismaClient, Coral } from '@prisma/client';
import { CreateCoralDto } from '../types/shared';

const prisma = new PrismaClient();

class CoralService {
  async findByAquariumId(aquariumId: string): Promise<Coral[]> {
    return await prisma.coral.findMany({
      where: { aquariumId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Coral | null> {
    return await prisma.coral.findUnique({
      where: { id },
    });
  }

  async create(aquariumId: string, data: CreateCoralDto): Promise<Coral> {
    return await prisma.coral.create({
      data: {
        ...data,
        aquariumId,
      },
    });
  }

  async update(id: string, data: Partial<CreateCoralDto>): Promise<Coral> {
    return await prisma.coral.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Coral> {
    return await prisma.coral.delete({
      where: { id },
    });
  }

  async updateImageKey(id: string, imageKey: string): Promise<Coral> {
    return await prisma.coral.update({
      where: { id },
      data: { imageKey },
    });
  }

  async clearImageKey(id: string): Promise<Coral> {
    return await prisma.coral.update({
      where: { id },
      data: { imageKey: null },
    });
  }
}

export const coralService = new CoralService();
