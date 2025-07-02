import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import type { Category } from "@/types";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

function Categories() {
  const { categories, loading, error, deleteCategory } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = (category: Category) => {
    // TODO: Implémenter la logique d'édition
    console.log("Éditer la catégorie:", category);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;

    setDeleting(true);
    try {
      await deleteCategory(selectedCategory.id);
      setSelectedCategory(null);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div>Chargement des catégories...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Catégories</h1>
      <div className="grid gap-4">
        {categories.length === 0 ? (
          <p className="text-gray-500">Aucune catégorie trouvée.</p>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{category.name}</h3>
                <p className="text-sm text-gray-500">
                  Créée le {new Date(category.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(category)}
                  className="p-2"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="p-2"
                      onClick={() => setSelectedCategory(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Supprimer la catégorie</DialogTitle>
                      <DialogDescription>
                        Êtes-vous sûr de vouloir supprimer{" "}
                        <span className="font-semibold">
                          {selectedCategory?.name}
                        </span>
                        ? Cette action est irréversible.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedCategory(null)}
                        disabled={deleting}
                      >
                        Annuler
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleConfirmDelete}
                        disabled={deleting}
                      >
                        {deleting ? "Suppression..." : "Supprimer"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Categories;
