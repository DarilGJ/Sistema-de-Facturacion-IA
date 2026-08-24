export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
