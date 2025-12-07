import { PrismaClient, User } from '@prisma/client';
import { CreateUserDto } from '@reefing/shared-types';

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
    }

    return user;
  }

  async updateUser(auth0Id: string, data: { name?: string }): Promise<User> {
    return prisma.user.update({
      where: { auth0Id },
      data,
    });
  }
}

export const userService = new UserService();
