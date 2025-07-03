
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import { CategoryForm } from "@/components/CategoryForm";
import type { Category } from "@/types";
import { toast } from "sonner";
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
  const { categories, loading, error, deleteCategory, addCategory, updateCategory } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowEditDialog(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteDialog(true);
  };

  const handleCreateSuccess = (newCategory: Category) => {
    addCategory(newCategory);
    setShowCreateDialog(false);
    toast.success(`Catégorie "${newCategory.name}" créée avec succès !`);
    // Notifier les autres composants que les catégories ont été mises à jour
    window.dispatchEvent(new CustomEvent('categoryUpdated'));
  };

  const handleEditSuccess = (updatedCategory: Category) => {
    updateCategory(updatedCategory);
    setShowEditDialog(false);
    setEditingCategory(null);
    toast.success(`Catégorie "${updatedCategory.name}" modifiée avec succès !`);
    // Notifier les autres composants que les catégories ont été mises à jour
    window.dispatchEvent(new CustomEvent('categoryUpdated'));
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;

    setDeleting(true);
    try {
      await deleteCategory(selectedCategory.id);
      toast.success(`Catégorie "${selectedCategory.name}" supprimée avec succès !`);
      setSelectedCategory(null);
      setShowDeleteDialog(false);
      // Notifier les autres composants que les catégories ont été mises à jour
      window.dispatchEvent(new CustomEvent('categoryUpdated'));
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de la catégorie");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setSelectedCategory(null);
    setShowDeleteDialog(false);
  };

  if (loading) {
    return <div>Chargement des catégories...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Catégories</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Créer une catégorie
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle catégorie</DialogTitle>
              <DialogDescription>
                Ajoutez une nouvelle catégorie pour organiser vos achats.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4">
        {categories.length === 0 ? (
          <p className="text-gray-500">Aucune catégorie trouvée.</p>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300" 
                  style={{ backgroundColor: category.color || '#3b82f6' }}
                />
                <div>
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="text-sm text-gray-500">
                    Créée le {new Date(category.createdAt).toLocaleDateString()}
                  </p>
                </div>
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
                <Button
                  variant="destructive"
                  size="sm"
                  className="p-2"
                  onClick={() => handleDelete(category)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog d'édition */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la catégorie.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingCategory(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
              onClick={handleCancelDelete}
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
  );
}

export default Categories;
