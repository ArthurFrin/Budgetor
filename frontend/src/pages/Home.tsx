import { api } from "@/lib/api";
import type { PurchaseStats } from "@/types/purchase";
import { useEffect, useState } from "react";
import { ChartPieDonutText } from "@/components/ChartPieDonutText";



function Home() {
  const [stats, setStats] = useState<PurchaseStats | null>(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("purchases/stats");
        const data = await response.json<PurchaseStats>();
        setStats(data);
        console.log("Stats fetched successfully:", data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Home</h1>
      {stats ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Total Amount: {stats.totalAmount} €</h2>
          <h3 className="text-lg mb-2">Total Count: {stats.totalCount}</h3>
          <h4 className="text-md font-semibold mb-2">Categories Stats:</h4>
          <ul>
            {stats.categoriesStats.map((categoryStat) => (
              <li key={categoryStat.category.id} className="mb-2">
                {categoryStat.category.name}: {categoryStat.totalAmount} € ({categoryStat.count} purchases)
              </li>
            ))}
          </ul>
          <ChartPieDonutText categoriesStats={stats.categoriesStats} />

        </div>

      ) : (
        <p>Loading stats...</p>
      )}
    </div>
  );
}
export default Home;