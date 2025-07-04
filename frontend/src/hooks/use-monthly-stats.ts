import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { type TimePeriod } from "@/hooks/use-stats";

export interface MonthlyStats {
  months: string[];
  categoryStats: {
    category: {
      id: string;
      name: string;
      color?: string;
      description?: string;
    };
    monthlyAmounts: number[];
  }[];
}

export function useMonthlyStats(months: number = 6) {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthlyStats = async (timePeriod: TimePeriod) => {
    try {
      setLoading(true);
      setError(null);
      
      const statsResponse = await api.get(
        `purchases/monthly-stats?startDate=${timePeriod.start}&endDate=${timePeriod.end}&months=${months}`
      );
      
      const statsData = await statsResponse.json<MonthlyStats>();
      
      console.log("Monthly stats data:", statsData);
      setMonthlyStats(statsData);
    } catch (err) {
      console.error("Error fetching monthly stats:", err);
      setError("Erreur lors du chargement des statistiques mensuelles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const defaultPeriod = {
      start: (() => {
        const date = new Date();
        date.setMonth(date.getMonth() - (months - 1));
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
      })(),
      end: new Date().toISOString()
    };
    
    // Charger les statistiques initiales
    fetchMonthlyStats(defaultPeriod);

    // Écouter les événements de mise à jour des catégories
    const handleCategoryUpdate = () => {
      fetchMonthlyStats(defaultPeriod);
    };

    window.addEventListener('categoryUpdated', handleCategoryUpdate);
    
    // Rafraîchir les données quand la page devient visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMonthlyStats(defaultPeriod);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('categoryUpdated', handleCategoryUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [months]);

  return {
    monthlyStats,
    loading,
    error,
    refetch: fetchMonthlyStats
  };
}
