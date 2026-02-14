import { PrismaClient, User, Prisma } from '@prisma/client';
import { CreateUserDto } from '../types/shared';

const prisma = new PrismaClient();

export class UserService {
  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { auth0Id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  private async generateUniqueUsername(email: string, auth0Id?: string): Promise<string> {
    // Extract base username from email (part before @)
    let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!baseUsername && auth0Id) {
      const sanitized = auth0Id.toLowerCase().replace(/[^a-z0-9]/g, '');
      baseUsername = sanitized || 'user';
    }

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
    const username = await this.generateUniqueUsername(data.email, data.auth0Id);
    try {
      return await prisma.user.create({
        data: {
          email: data.email,
          name: data.name || null,
          auth0Id: data.auth0Id,
          username,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2022') {
        return prisma.user.create({
          data: {
            email: data.email,
            name: data.name || null,
            auth0Id: data.auth0Id,
          },
        });
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existingByEmail = await this.findByEmail(data.email);
        if (existingByEmail) {
          return prisma.user.update({
            where: { id: existingByEmail.id },
            data: { auth0Id: data.auth0Id, name: data.name || existingByEmail.name },
          });
        }
      }
      throw error;
    }
  }

  async findOrCreate(auth0Id: string, email: string, name?: string): Promise<User> {
    let user = await this.findByAuth0Id(auth0Id);

    if (!user) {
      const existingByEmail = await this.findByEmail(email);
      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { auth0Id, name: name || existingByEmail.name },
        });
      } else {
        try {
          user = await this.createUser({
            auth0Id,
            email,
            name,
          });
        } catch (error) {
          const retryUser = await this.findByAuth0Id(auth0Id);
          if (retryUser) {
            return retryUser;
          }
          const retryByEmail = await this.findByEmail(email);
          if (retryByEmail) {
            return retryByEmail;
          }
          throw error;
        }
      }
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
