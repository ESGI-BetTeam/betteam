export interface User {
    id: string;
    avatar: string | null; 
    email: string; 
    username: string; 
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
    updatedAt: Date;
    createdAt: Date;
}

export interface PrivateUser extends User {
    passwordHash: string;
}