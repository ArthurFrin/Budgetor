import { useCategories } from "@/hooks/use-categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {useTranslation} from "react-i18next";

interface CategorySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CategorySelect({ 
  value, 
  onValueChange, 
  placeholder,
  className 
}: CategorySelectProps) {
  const { t } = useTranslation();
  const { categories, loading, error } = useCategories();

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder={t("createSpending.category.loading")} />
        </SelectTrigger>
      </Select>
    );
  }

  if (error) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder={t("createSpending.category.error")} />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder ?? t("createSpending.category.placeholder")} />
      </SelectTrigger>
      <SelectContent>
        {/* Option "Autre" toujours disponible */}
        <SelectItem value="null" className="font-medium">
          {t("createSpending.category.other")}
        </SelectItem>
        
        {categories.length === 0 ? (
          <SelectItem value="" disabled>
            {t("createSpending.category.empty")}
          </SelectItem>
        ) : (
          categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
