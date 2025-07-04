"use client";

import * as React from "react";
import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { type StatsWithCategories, type TimePeriod } from "@/hooks/use-stats";
import { DateRangePicker } from "./DateRangePicker";

interface ChartPieDonutTextProps {
  categoriesStats: StatsWithCategories["categoriesStats"];
  onPeriodChange?: (period: TimePeriod) => void;
}

export function ChartPieDonutText({
  categoriesStats,
  onPeriodChange,
}: ChartPieDonutTextProps) {
  const chartData = React.useMemo(
    () =>
      categoriesStats.map((c) => ({
        category: c.category?.name || "Autre",
        amount: c.totalAmount,
        fill: c.category?.color || "#cccccc",
      })),
    [categoriesStats]
  );

  const totalAmount = chartData.reduce((acc, curr) => acc + curr.amount, 0);

  const chartConfig = {
    amount: {
      label: "Montant",
    },
  } satisfies ChartConfig;

  const handleDateRangeChange = (dateRange: { startDate: Date; endDate: Date }) => {
    console.log("DateRangePicker a sélectionné une nouvelle période:", {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    
    if (onPeriodChange) {
      onPeriodChange({
        start: dateRange.startDate.toISOString(),
        end: dateRange.endDate.toISOString(),
      });
    }
  };

  return (
    <Card className="flex flex-col w-xl">
      <CardHeader className="items-center pb-0">
        <CardTitle>Dépenses par catégorie</CardTitle>
        <CardDescription className="w-full">
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 relative">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg font-bold w-28 h-28 flex items-center justify-center">
          {totalAmount.toFixed(2)} €
        </div>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="category"
              innerRadius={60}
              strokeWidth={5}
            ></Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="text-muted-foreground leading-none">
          Répartition des dépenses par catégorie {totalAmount.toFixed(2)} €
        </div>
      </CardFooter>
    </Card>
  );
}
