import { PrismaClient, User } from '@prisma/client';
import { CreateUserDto } from '../types/shared';

const prisma = new PrismaClient();

export class UserService {
  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { auth0Id },
    });
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name || null,
        auth0Id: data.auth0Id,
      },
    });
  }

  async findOrCreate(auth0Id: string, email: string, name?: string): Promise<User> {
    let user = await this.findByAuth0Id(auth0Id);

    if (!user) {
      user = await this.createUser({
        auth0Id,
        email,
        name,
      });

      // Create sample aquariums for new users
      await this.createSampleAquariums(user.id);
    }

    return user;
  }

  private async createSampleAquariums(userId: string): Promise<void> {
    const sampleAquariums = [
      {
        name: 'Main Reef Display',
        type: 'reef',
        volume: 180,
        description: 'Large mixed reef tank with SPS, LPS, and soft corals.',
        userId,
      },
      {
        name: 'Nano Reef',
        type: 'reef',
        volume: 25,
        description: 'Small nano reef focused on soft corals and a few small fish.',
        userId,
      },
    ];

    await prisma.aquarium.createMany({
      data: sampleAquariums,
    });
  }

  async updateUser(auth0Id: string, data: { name?: string }): Promise<User> {
    return prisma.user.update({
      where: { auth0Id },
      data,
    });
  }
}

export const userService = new UserService();
