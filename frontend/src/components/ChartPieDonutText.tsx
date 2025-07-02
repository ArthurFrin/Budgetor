"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
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

import { type PurchaseStats } from "@/types/purchase";

export function ChartPieDonutText({
  categoriesStats,
}: {
  categoriesStats: PurchaseStats["categoriesStats"];
}) {
  const chartData = React.useMemo(
    () =>
      categoriesStats.map((c) => ({
        category: c.category.name,
        amount: c.totalAmount,
        fill: c.category.color || "var(--chart-1)",
      })),
    [categoriesStats]
  );

  const totalAmount = chartData.reduce((acc, curr) => acc + curr.amount, 0);

  // Si tu veux garder le même ChartConfig structurellement :
  const chartConfig = {
    amount: {
      label: "Montant",
    },
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col w-xl">
      
      <CardHeader className="items-center pb-0">
        <CardTitle>Dépenses par catégorie</CardTitle>
        <CardDescription>Période sélectionnée</CardDescription>
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
            >
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Répartition des dépenses par catégorie {totalAmount.toFixed(2)} €
        </div>
      </CardFooter>
    </Card>
  );
}
