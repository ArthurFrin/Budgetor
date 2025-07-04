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

export interface TimePeriod {
  start: string; // ISO date string
  end: string; // ISO date string
}

export function useStats() {
  const [stats, setStats] = useState<StatsWithCategories | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (timePeriod: TimePeriod) => {
    try {
      setLoading(true);
      setError(null);
      
      const statsResponse = await api.get(`purchases/stats?startDate=${timePeriod.start}&endDate=${timePeriod.end}`);
      const statsData = await statsResponse.json<StatsWithCategories>();
      
      console.log("Stats data with categories for period:", {
        startDate: new Date(timePeriod.start).toLocaleString(),
        endDate: new Date(timePeriod.end).toLocaleString(),
        data: statsData
      });
      setStats(statsData);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const defaultPeriod = {
      start: new Date(0).toISOString(),
      end: new Date().toISOString()
    };
    
    // Charger les statistiques initiales
    fetchStats(defaultPeriod);

    // Écouter les événements de mise à jour des catégories
    const handleCategoryUpdate = () => {
      fetchStats(defaultPeriod);
    };

    window.addEventListener('categoryUpdated', handleCategoryUpdate);
    
    // Rafraîchir les données quand la page devient visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats(defaultPeriod);
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
