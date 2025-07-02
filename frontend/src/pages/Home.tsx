import { useStats } from "@/hooks/use-stats";
import { ChartPieDonutText } from "@/components/ChartPieDonutText";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";



function Home() {
  const { stats, loading, error, refetch } = useStats();
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Home</h1>
        <Button 
          onClick={refetch} 
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>
      
      {loading && !stats ? (
        <p>Chargement des statistiques...</p>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : stats ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Total Amount: {stats.totalAmount} €</h2>
          <h3 className="text-lg mb-2">Total Count: {stats.totalCount}</h3>
          <h4 className="text-md font-semibold mb-2">Categories Stats:</h4>
          <ul>
            {stats.categoriesStats.map((categoryStat) => (
              <li key={categoryStat.category.id} className="mb-2 flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full border border-gray-300" 
                  style={{ backgroundColor: categoryStat.category.color || '#3b82f6' }}
                />
                {categoryStat.category.name}: {categoryStat.totalAmount} € ({categoryStat.count} achats)
              </li>
            ))}
          </ul>
          <ChartPieDonutText categoriesStats={stats.categoriesStats} />
        </div>
      ) : (
        <p>Aucune donnée disponible.</p>
      )}
    </div>
  );
}
export default Home;