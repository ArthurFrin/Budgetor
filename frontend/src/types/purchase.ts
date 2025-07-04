import type { User } from './user';
import type { Category } from './category';

export interface Purchase {
  id: string;
  price: number;
  description?: string;
  date: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: User;
  categoryId?: string;
  category?: Category;
}

export interface CreatePurchaseData {
  price: number;
  description?: string;
  date: string;
  tags?: string[];
  categoryId?: string;
}

export interface UpdatePurchaseData {
  price?: number;
  description?: string;
  date?: string;
  tags?: string[];
  categoryId?: string;
}

export interface PurchaseStats {
  totalAmount: number;
  totalCount: number;
  categoriesStats: (
    | {
        categoryId: string;
        totalAmount: number;
        count: number;
      }
    | {
        category: { id: string };
        totalAmount: number;
        count: number;
      }
  )[];
}
