import { PrismaClient, Equipment } from '@prisma/client';
import { CreateEquipmentDto } from '../types/shared';

const prisma = new PrismaClient();

class EquipmentService {
  async findByAquariumId(aquariumId: string): Promise<Equipment[]> {
    return await prisma.equipment.findMany({
      where: { aquariumId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Equipment | null> {
    return await prisma.equipment.findUnique({
      where: { id },
    });
  }

  async create(aquariumId: string, data: CreateEquipmentDto): Promise<Equipment> {
    return await prisma.equipment.create({
      data: {
        ...data,
        aquariumId,
      },
    });
  }

  async update(id: string, data: Partial<CreateEquipmentDto>): Promise<Equipment> {
    return await prisma.equipment.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Equipment> {
    return await prisma.equipment.delete({
      where: { id },
    });
  }
}

export const equipmentService = new EquipmentService();
