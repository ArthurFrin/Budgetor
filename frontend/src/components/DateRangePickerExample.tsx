"use client";

import * as React from "react";
import { DateRangePicker } from "./DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DateRangePickerExample() {
  const handleDateRangeChange = (dateRange: { startDate: Date; endDate: Date }) => {
    console.log("Nouvelle période:", dateRange);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sélection de période</CardTitle>
      </CardHeader>
      <CardContent>
        <DateRangePicker onDateRangeChange={handleDateRangeChange} />
        <div className="mt-4 text-sm text-muted-foreground">
          Cliquez sur le bouton ci-dessus pour sélectionner une date centrale. 
          La période affichée correspond à 30 jours autour de cette date.
        </div>
      </CardContent>
    </Card>
  );
}
