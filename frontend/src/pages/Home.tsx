import { useStats } from "@/hooks/use-stats";
import { ChartPieDonutText } from "@/components/ChartPieDonutText";



function Home() {
  const { stats, loading, error } = useStats();
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {loading && !stats ? (
        <p>Chargement des statistiques...</p>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-700">Total des dépenses</h2>
              <p className="text-2xl font-bold text-blue-600">{stats.totalAmount.toFixed(2)} €</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-700">Nombre d'achats</h2>
              <p className="text-2xl font-bold text-green-600">{stats.totalCount}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Dépenses par catégorie</h3>
            <ul className="space-y-2">
              {stats.categoriesStats.map((categoryStat) => (
                <li key={categoryStat.category.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300" 
                      style={{ backgroundColor: categoryStat.category.color || '#3b82f6' }}
                    />
                    <span className="font-medium">{categoryStat.category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{categoryStat.totalAmount.toFixed(2)} €</div>
                    <div className="text-sm text-gray-500">{categoryStat.count} achat{categoryStat.count > 1 ? 's' : ''}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <ChartPieDonutText categoriesStats={stats.categoriesStats} />
        </div>
      ) : (
        <p>Aucune donnée disponible.</p>
      )}
    </div>
  );
}
export default Home;