import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface StatsWithCategories {
  totalAmount: number;
  totalCount: number;
  categoriesStats: {
    category: {
      id: string;
      name: string;
      color?: string;
      description?: string;
    };
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
      
      const statsResponse = await api.get("purchases/stats");
      const statsData = await statsResponse.json<StatsWithCategories>();
      
      console.log("Stats data with categories:", statsData);
      setStats(statsData);
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
