// User type matching Prisma schema
export interface User {
  id: string;
  email: string;
  name: string | null;
  auth0Id: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User creation DTO
export interface CreateUserDto {
  email: string;
  name?: string;
  auth0Id: string;
}
