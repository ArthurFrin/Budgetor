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
import {useTranslation} from "react-i18next";

interface ChartPieDonutTextProps {
  categoriesStats: StatsWithCategories["categoriesStats"];
  onPeriodChange?: (period: TimePeriod) => void;
}

export function ChartPieDonutText({
  categoriesStats,
  onPeriodChange,
}: ChartPieDonutTextProps) {
  const { t } = useTranslation();
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
    <Card className="flex flex-col w-xl h-fit">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t("home.stats.charts.spendingPerCategory.title")}</CardTitle>
        <CardDescription className="w-full">
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 relative">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg font-bold w-28 h-28 flex items-center justify-center">
          {t("common.currency", {amount: totalAmount})}
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
          {t("home.stats.charts.spendingPerCategory.description", {total: totalAmount})}
        </div>
      </CardFooter>
    </Card>
  );
}
