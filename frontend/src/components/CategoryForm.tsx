import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { Category, CreateCategoryData } from "@/types";

interface CategoryFormProps {
  category?: Category;
  onSuccess: (category: Category) => void;
  onCancel: () => void;
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#6b7280", // gray
];

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: category?.name || "",
    color: category?.color || "#3b82f6",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Le nom de la catégorie est requis");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      if (category) {
        response = await api.put(`categories/${category.id}`, {
          json: formData
        });
      } else {
        response = await api.post("categories", {
          json: formData
        });
      }

      const savedCategory = await response.json<Category>();
      onSuccess(savedCategory);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
      setError(category ? "Erreur lors de la modification" : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="name">Nom de la catégorie</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Entrez le nom de la catégorie"
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Couleur</Label>
        <div className="space-y-3">
          <Input
            id="color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            disabled={loading}
            className="w-20 h-10"
          />
          
          <div className="grid grid-cols-8 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  formData.color === color 
                    ? "border-gray-800 scale-110" 
                    : "border-gray-300 hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData(prev => ({ ...prev, color }))}
                disabled={loading}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.name.trim()}
        >
          {loading 
            ? (category ? "Modification..." : "Création...") 
            : (category ? "Modifier" : "Créer")
          }
        </Button>
      </div>
    </form>
  );
}
