import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Category } from "@/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("categories");
      const categoriesData = await response.json<Category[]>();
      setCategories(categoriesData);
    } catch (err) {
      console.error("Erreur lors de la récupération des catégories:", err);
      setError("Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const deleteCategory = async (categoryId: string) => {
    try {
      await api.delete(`categories/${categoryId}`, {
        headers: {
          'Content-Type': undefined
        }
      });
      // Retirer la catégorie de la liste locale
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      throw new Error("Erreur lors de la suppression de la catégorie");
    }
  };

  const addCategory = (newCategory: Category) => {
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (updatedCategory: Category) => {
    setCategories(prev => 
      prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat)
    );
  };

  const refetch = () => {
    fetchCategories();
  };

  return {
    categories,
    loading,
    error,
    deleteCategory,
    addCategory,
    updateCategory,
    refetch
  };
}
