import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { PurchaseStats } from "@/types/purchase";
import type { Category } from "@/types/category";

export interface StatsWithCategories {
  totalAmount: number;
  totalCount: number;
  categoriesStats: {
    category: Category;
    totalAmount: number;
    count: number;
  }[];
}

export function useStats() {
  const [stats, setStats] = useState<StatsWithCategories | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsResponse, categoriesResponse] = await Promise.all([
        api.get("purchases/stats"),
        api.get("categories")
      ]);
      
      const statsData = await statsResponse.json<PurchaseStats>();
      const categoriesData = await categoriesResponse.json<Category[]>();
      
      console.log("Raw stats data:", statsData);
      console.log("Categories data:", categoriesData);
      
      const categoriesMap = new Map<string, Category>();
      categoriesData.forEach(category => {
        categoriesMap.set(category.id, category);
      });
      
      const statsWithCategories: StatsWithCategories = {
        totalAmount: statsData.totalAmount,
        totalCount: statsData.totalCount,
        categoriesStats: statsData.categoriesStats
          .map(stat => {
            const categoryId = 'categoryId' in stat ? stat.categoryId : stat.category.id;
            const category = categoriesMap.get(categoryId);
            if (!category) {
              console.warn(`Category not found for ID: ${categoryId}`);
              return null;
            }
            return {
              category,
              totalAmount: stat.totalAmount,
              count: stat.count
            };
          })
          .filter((stat): stat is NonNullable<typeof stat> => stat !== null)
      };
      
      setStats(statsWithCategories);
      console.log("Stats fetched and joined successfully:", statsWithCategories);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Écouter les événements de mise à jour des catégories
    const handleCategoryUpdate = () => {
      fetchStats();
    };

    window.addEventListener('categoryUpdated', handleCategoryUpdate);
    
    // Rafraîchir les données quand la page devient visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('categoryUpdated', handleCategoryUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}
