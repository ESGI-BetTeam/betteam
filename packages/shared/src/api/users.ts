import { User } from "../interfaces/User";

// GET /api/users/:id
export interface GetUserResponse {
  user: User;
}

// GET /api/users
export interface GetUsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export namespace GetUsersRequest {
  export interface Query {
    page?: number;
    limit?: number;
    search?: string;
  }
}

// PATCH /api/users/:id
export namespace UpdateUserRequest {
  export interface Body {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }
}

export interface UpdateUserResponse {
  user: User;
}

// POST /api/users/:id/password
export namespace UpdatePasswordRequest {
  export interface Body {
    currentPassword: string;
    newPassword: string;
  }
}

export interface UpdatePasswordResponse {
  message: string;
}

// DELETE /api/users/:id
export interface DeleteUserResponse {
  message: string;
}
