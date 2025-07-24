"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import { useMonthlyStats } from "@/hooks/use-monthly-stats"
import { type TimePeriod } from "@/hooks/use-stats"
import i18next from "i18next";

interface ChartBarStackedProps {
  onPeriodChange?: (period: TimePeriod) => void;
}

export function ChartBarStacked({ onPeriodChange }: ChartBarStackedProps) {
  const { monthlyStats, loading, error, refetch } = useMonthlyStats(6);

  const translate = i18next.getFixedT(null, null, "home.stats");

  // Fonction pour gérer les changements de période
  const handlePeriodChange = React.useCallback((newPeriod: TimePeriod) => {
    console.log("Nouvelle période sélectionnée pour le graphique:", {
      start: new Date(newPeriod.start).toLocaleDateString(),
      end: new Date(newPeriod.end).toLocaleDateString()
    });
    refetch(newPeriod);
    
    // Propager le changement de période au composant parent si nécessaire
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    }
  }, [refetch, onPeriodChange]);
  
  // Créer un objet de configuration dynamique pour le graphique
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    
    if (!monthlyStats?.categoryStats) return config;
    
    monthlyStats.categoryStats.forEach((categoryStat, index) => {
      const categoryId = categoryStat.category.id
      config[categoryId] = {
        label: categoryStat.category.name,
        color: categoryStat.category.color || `var(--chart-${index + 1})`,
      }
    });
    
    return config
  }, [monthlyStats]);

  // Transformer les données pour le graphique
  const chartData = React.useMemo(() => {
    // Si pas de données, renvoyer un tableau vide
    if (!monthlyStats?.months || !monthlyStats?.categoryStats?.length) return [];

    // Initialiser les données du graphique avec les mois
    type ChartDataItem = { month: string; [key: string]: string | number }
    const data: ChartDataItem[] = monthlyStats.months.map(month => ({ month }));

    // Ajouter les données pour chaque catégorie
    monthlyStats.categoryStats.forEach(categoryStat => {
      const categoryId = categoryStat.category.id;
      
      // Ajouter les montants mensuels pour chaque catégorie
      categoryStat.monthlyAmounts.forEach((amount, index) => {
        if (data[index]) {
          data[index][categoryId] = amount;
        }
      });
    });

    return data;
  }, [monthlyStats]);

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>{translate("charts.monthlySpending.title")}</CardTitle>
        <CardDescription>{translate("charts.monthlySpending.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-500">
            {translate("charts.monthlySpending.loading")}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40 text-red-500">
            {error}
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent payload={undefined} />} />
              {monthlyStats?.categoryStats.map((categoryStat, index: number) => (
                <Bar
                  key={categoryStat.category.id}
                  dataKey={categoryStat.category.id}
                  stackId="a"
                  fill={categoryStat.category.color || `var(--chart-${index + 1})`}
                  radius={index === 0 ? [0, 0, 4, 4] : index === monthlyStats.categoryStats.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-500">
            {translate("charts.monthlySpending.empty")}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {monthlyStats?.categoryStats && monthlyStats.categoryStats.length > 0 && (
          <div className="flex gap-2 leading-none font-medium">
            <TrendingUp className="h-4 w-4" /> {translate("charts.monthlySpending.footer.perCategory")}
          </div>
        )}
        <div className="text-muted-foreground leading-none">
          {translate("charts.monthlySpending.footer.6Months")}
        </div>
      </CardFooter>
    </Card>
  )
}
