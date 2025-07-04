import ky from "ky";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Instance ky configurée pour l'API
export const api = ky.create({
  prefixUrl: API_URL,
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});

// Types pour les réponses API
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name?: string;
  password: string;
}

export interface ForgetPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
