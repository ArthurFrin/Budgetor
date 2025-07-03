// Imports des types
import type { User, LoginData, RegisterData } from './user';

// Interface pour les contextes d'authentification
export interface LoginResult {
  success: boolean;
  error?: string;
  retryAfter?: number;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkMe: () => Promise<void>;
}

// Interface pour les réponses API communes
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// Interface pour les erreurs API
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

// Réexport de tous les types
export type { User, LoginData, RegisterData } from './user';
export type { Category, CreateCategoryData } from './category';
export type { Purchase, CreatePurchaseData, UpdatePurchaseData } from './purchase';
