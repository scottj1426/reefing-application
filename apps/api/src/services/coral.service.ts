import { PrismaClient } from '@prisma/client';
import { CreateCoralDto, Coral as ApiCoral } from '../types/shared';

const prisma = new PrismaClient();

class CoralService {
  async findByAquariumId(aquariumId: string): Promise<ApiCoral[]> {
    return (await prisma.coral.findMany({
      where: { aquariumId },
      orderBy: { createdAt: 'desc' },
    })) as ApiCoral[];
  }

  async findById(id: string): Promise<ApiCoral | null> {
    return (await prisma.coral.findUnique({
      where: { id },
    })) as ApiCoral | null;
  }

  async create(aquariumId: string, data: CreateCoralDto): Promise<ApiCoral> {
    return (await prisma.coral.create({
      data: {
        ...data,
        aquariumId,
      },
    })) as ApiCoral;
  }

  async update(id: string, data: Partial<CreateCoralDto>): Promise<ApiCoral> {
    return (await prisma.coral.update({
      where: { id },
      data,
    })) as ApiCoral;
  }

  async delete(id: string): Promise<ApiCoral> {
    return (await prisma.coral.delete({
      where: { id },
    })) as ApiCoral;
  }

  async updateImageKey(id: string, imageKey: string): Promise<ApiCoral> {
    return (await prisma.coral.update({
      where: { id },
      data: { imageKey },
    })) as ApiCoral;
  }

  async clearImageKey(id: string): Promise<ApiCoral> {
    return (await prisma.coral.update({
      where: { id },
      data: { imageKey: null },
    })) as ApiCoral;
  }
}

export const coralService = new CoralService();
