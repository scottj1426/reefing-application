import { PrismaClient, User } from '@prisma/client';
import { CreateUserDto } from '../types/shared';

const prisma = new PrismaClient();

export class UserService {
  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { auth0Id },
    });
  }

  private async generateUniqueUsername(email: string): Promise<string> {
    // Extract base username from email (part before @)
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    // Try the base username first
    let username = baseUsername;
    let exists = await prisma.user.findUnique({ where: { username } });

    // If it exists, append numbers until we find a unique one
    let counter = 1;
    while (exists) {
      username = `${baseUsername}${counter}`;
      exists = await prisma.user.findUnique({ where: { username } });
      counter++;
    }

    return username;
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const username = await this.generateUniqueUsername(data.email);

    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name || null,
        auth0Id: data.auth0Id,
        username,
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
    } else {
      // Update email if it's still a placeholder
      if (user.email.includes('@auth0.placeholder') && !email.includes('@auth0.placeholder')) {
        user = await prisma.user.update({
          where: { auth0Id },
          data: { email, name: name || user.name },
        });
      }
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
