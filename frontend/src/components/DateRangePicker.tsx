"use client";

import * as React from "react";
import { format, addDays, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

interface DateRangePickerProps {
  onDateRangeChange?: (dateRange: { startDate: Date; endDate: Date }) => void;
  initialDate?: Date;
}

export function DateRangePicker({
  onDateRangeChange,
  initialDate = new Date(),
}: DateRangePickerProps) {
  const [centerDate, setCenterDate] = React.useState<Date>(initialDate);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  // Calculer la période de 30 jours autour de la date centrale
  const startDate = React.useMemo(() => subDays(centerDate, 15), [centerDate]);
  const endDate = React.useMemo(() => addDays(centerDate, 15), [centerDate]);

  // Formater la période pour l'affichage
  const formattedDateRange = React.useMemo(() => {
    return `Du ${format(startDate, "dd/MM/yyyy", { locale: fr })} au ${format(
      endDate,
      "dd/MM/yyyy",
      { locale: fr }
    )}`;
  }, [startDate, endDate]);

  // Notifier le changement initial (uniquement au premier rendu)
  React.useEffect(() => {
    if (onDateRangeChange) {
      onDateRangeChange({ startDate, endDate });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      setCenterDate(date);
      setIsCalendarOpen(false);
      
      // Appeler le callback seulement quand l'utilisateur sélectionne activement une date
      if (onDateRangeChange) {
        const newStartDate = subDays(date, 15);
        const newEndDate = addDays(date, 15);
        onDateRangeChange({ startDate: newStartDate, endDate: newEndDate });
      }
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{formattedDateRange}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <div className="p-2 text-sm text-center text-muted-foreground">
            Sélectionnez une date centrale
          </div>
          <Calendar
            mode="single"
            selected={centerDate}
            onSelect={handleSelectDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
