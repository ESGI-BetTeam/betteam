export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  avatar: string | null;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  pushTokens: string[];
  updatedAt: Date;
  createdAt: Date;
}

export interface PrivateUser extends User {
  passwordHash: string;
}
