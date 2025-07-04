import * as React from "react";
import { useStats, type TimePeriod } from "@/hooks/use-stats";
import { ChartPieDonutText } from "@/components/ChartPieDonutText";
import { ChartBarStacked } from "@/components/ChartBarStacked";

function Home() {
  // État pour la catégorie sélectionnée
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  
  const { stats, loading, error, refetch } = useStats();
  
  // Fonction pour gérer les changements de période
  const handlePeriodChange = React.useCallback((newPeriod: TimePeriod) => {
    console.log("Nouvelle période sélectionnée:", {
      start: new Date(newPeriod.start).toLocaleDateString(),
      end: new Date(newPeriod.end).toLocaleDateString()
    });
    refetch(newPeriod);
  }, [refetch]);
  
  // Filtrer les statistiques par catégorie si une catégorie est sélectionnée
  const filteredCategoryStats = React.useMemo(() => {
    if (!stats || !selectedCategory) return stats?.categoriesStats;
    
    return stats.categoriesStats.filter(
      categoryStat => categoryStat.category.id === selectedCategory
    );
  }, [stats, selectedCategory]);
  
  return (
    <div className="container mx-auto p-8">
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
            <div className="flex flex-grow gap-4 flex-col lg:flex-row">
              <ChartPieDonutText 
                categoriesStats={filteredCategoryStats || []} 
                onPeriodChange={handlePeriodChange}
              />
              <ChartBarStacked onPeriodChange={handlePeriodChange} />
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Dépenses par catégorie</h3>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {stats.categoriesStats.map((categoryStat) => (
                <button
                  key={`filter-${categoryStat.category.id}`}
                  onClick={() => {
                    if (selectedCategory === categoryStat.category.id) {
                      setSelectedCategory(null);
                    } else {
                      setSelectedCategory(categoryStat.category.id);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                    selectedCategory === categoryStat.category.id
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: categoryStat.category.color || '#3b82f6' }}
                  />
                  {categoryStat.category.name}
                </button>
              ))}
            </div>
            
            <ul className="space-y-2">
              {filteredCategoryStats && filteredCategoryStats.length > 0 ? (
                filteredCategoryStats.map((categoryStat) => (
                  <li 
                    key={categoryStat.category.id} 
                    className="flex items-center justify-between p-3 bg-white border rounded-lg"
                    onClick={() => setSelectedCategory(categoryStat.category.id)}
                    style={{ cursor: 'pointer' }}
                  >
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
                ))
              ) : (
                <li className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                  Aucune dépense trouvée pour cette catégorie dans la période sélectionnée.
                </li>
              )}
            </ul>
          </div>
          
        </div>
      ) : (
        <p>Aucune donnée disponible.</p>
      )}
    </div>
  );
}
export default Home;