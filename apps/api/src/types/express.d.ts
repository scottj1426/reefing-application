import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub?: string;
        email?: string;
        name?: string;
        [key: string]: any;
      };
      user?: User;
    }
  }
}

export {};
