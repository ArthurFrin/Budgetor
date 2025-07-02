export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt: string;
}

export interface CreateCategoryData {
  name: string;
  color?: string;
  icon?: string;
}
