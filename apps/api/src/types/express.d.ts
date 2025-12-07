declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub?: string;
        email?: string;
        name?: string;
        [key: string]: any;
      };
    }
  }
}

export {};
