import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CategorySelect } from "@/components/CategorySelect";
import { api } from "@/lib/api";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router";

// Schéma de validation Zod
const purchaseSchema = z.object({
  price: z.number({ invalid_type_error: "Le montant est requis" })
    .positive("Le montant doit être positif"),
  description: z.string().optional(),
  date: z.date({
    required_error: "La date est requise",
    invalid_type_error: "Format de date invalide",
  }),
  category: z.string().nonempty("La catégorie est requise"),
  tags: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

function NewPurchase() {
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      description: "",
      tags: "",
      category: "",
      date: new Date(),
    },
  });

  const onSubmit = async (data: PurchaseFormData) => {
    setApiError("");

    try {
      const tagsArray = data.tags
        ? data.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];

      const purchaseData = {
        price: data.price,
        description: data.description || "",
        date: data.date.toISOString(),
        categoryId: data.category, // Assurez-vous que c'est l'ID
        tags: tagsArray,
      };

      await api.post("purchases", { json: purchaseData });

      toast.success("Achat ajouté avec succès !");
      reset();
      navigate("/purchases");
    } catch (error) {
      console.error("Erreur API :", error);
      const errorMessage = "Une erreur est survenue lors de l'ajout de la dépense.";
      setApiError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex items-center min-h-screen justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">Ajouter une dépense</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">Montant (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                placeholder="ex: Restaurant"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.date && (
                <p className="text-sm text-red-600">{errors.date.message?.toString()}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <CategorySelect
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input
                id="tags"
                type="text"
                placeholder="ex: midi,pro"
                {...register("tags")}
              />
              {errors.tags && (
                <p className="text-sm text-red-600">{errors.tags.message}</p>
              )}
            </div>
            {apiError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {apiError}
              </div>
            )}
            <Button 
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enregistrement..." : "Ajouter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default NewPurchase;
