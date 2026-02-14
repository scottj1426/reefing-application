import { PrismaClient, Aquarium, AquariumPhoto, Prisma } from '@prisma/client';
import { CreateAquariumDto } from '../types/shared';

const prisma = new PrismaClient();

export class AquariumService {
  async findByUserId(userId: string, includeRelations = false): Promise<Aquarium[]> {
    try {
      return await prisma.aquarium.findMany({
        where: { userId },
        include: includeRelations
          ? {
              equipment: true,
              corals: true,
              photos: true,
            }
          : {
              photos: true,
            },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2021' || error.code === 'P2022') {
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
      }
      throw error;
    }
  }

  async findById(id: string, includeRelations = false): Promise<Aquarium | null> {
    try {
      return await prisma.aquarium.findUnique({
        where: { id },
        include: includeRelations
          ? {
              equipment: true,
              corals: true,
              photos: true,
            }
          : {
              photos: true,
            },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2021' || error.code === 'P2022') {
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
      }
      throw error;
    }
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

  async addPhotos(aquariumId: string, imageKeys: string[]): Promise<Aquarium> {
    await prisma.aquariumPhoto.createMany({
      data: imageKeys.map((imageKey) => ({
        aquariumId,
        imageKey,
      })),
    });

    return prisma.aquarium.findUnique({
      where: { id: aquariumId },
      include: { photos: true },
    }) as Promise<Aquarium>;
  }

  async deletePhoto(photoId: string): Promise<AquariumPhoto> {
    return prisma.aquariumPhoto.delete({
      where: { id: photoId },
    });
  }

  async listPhotos(aquariumId: string): Promise<AquariumPhoto[]> {
    return prisma.aquariumPhoto.findMany({
      where: { aquariumId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const aquariumService = new AquariumService();
