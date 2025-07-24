import { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useCategories } from "@/hooks/use-categories";
import type { Purchase } from "@/types/purchase";
import type { Category } from "@/types/category";
import {useTranslation} from "react-i18next";

interface PurchaseWithCategory extends Purchase {
  category?: Category;
}

export default function MyPurchases() {
  const [purchases, setPurchases] = useState<PurchaseWithCategory[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { categories } = useCategories();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const purchasesResponse = await api.get("purchases");
        const purchasesData = await purchasesResponse.json() as PurchaseWithCategory[];

        console.log("Purchases data:", purchasesData);
        setPurchases(purchasesData);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns: ColumnDef<PurchaseWithCategory>[] = useMemo(
    () => [
      {
        accessorKey: "date",
        header: t("spending.table.date.header"),
        cell: ({ row }) => {
          const date = new Date(row.getValue("date"));
          return (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {t("common.date", {date: date})}
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: t("spending.table.description.header"),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("description")}</div>
        ),
      },
      {
        accessorKey: "price",
        header: t("spending.table.amount.header"),
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("price"));
          return (
            <div className="text-right font-mono">
              {t("common.currency", {amount: amount})}
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: t("spending.table.category.header"),
        cell: ({ row }) => {
          const category = row.getValue("category") as Category;
          
          // Vérifier si c'est un achat sans catégorie ou avec la catégorie "other"
          if (!category || category === null || category === undefined || category.id === 'other') {
            return <Badge variant="outline">{t("spending.table.category.other")}</Badge>;
          }
          
          return (
            <Badge
              style={{
                backgroundColor: `${category.color}20`,
                color: category.color,
                borderColor: category.color,
              }}
              variant="outline"
            >
              {category.name}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          const category = row.getValue(id) as Category;
          return category?.name?.toLowerCase().includes(value.toLowerCase()) ?? false;
        },
      },
    ],
    [t]
  );

  // Filtrer les achats par catégorie sélectionnée
  const filteredData = useMemo(() => {
    if (!selectedCategory) return purchases;
    
    return purchases.filter(purchase => {
      // Pour les achats sans catégorie
      if (selectedCategory === "null") {
        // Vérifie si la catégorie est null, undefined, un objet vide, ou a l'id "other"
        return !purchase.category || 
               purchase.category === null || 
               purchase.category === undefined || 
               purchase.category?.id === 'other';
      }
      // Filtrage normal par catégorie
      return purchase.category?.id === selectedCategory;
    });
  }, [purchases, selectedCategory]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 10,
      },
      sorting: [
        {
          id: "date",
          desc: true,
        },
      ],
    },
  });

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">{t("spending.loading")}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("spending.title")}</h1>
        <p className="text-muted-foreground">
          {t("spending.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("spending.table.title")}</CardTitle>
          <CardDescription>
            {t("spending.table.subtitle.spendingCount", { count: filteredData.length })}
            {selectedCategory && (
              <>
                {t("spending.table.subtitle.spendingInCategory", {
                  category: selectedCategory
                      ? (categories?.find(c => c.id === selectedCategory)?.name || t("spending.table.category.other"))
                      : t("spending.table.category.other")}
                )}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtre global */}
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("spending.table.search.placeholder")}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="max-w-sm"
            />
          </div>
          
          {/* Filtres par catégorie */}
          <div className="mb-4">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t("spending.table.filter.byCategoryTitle")}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories?.map((category) => (
                <button
                  key={`filter-${category.id}`}
                  onClick={() => {
                    // Toggle: si déjà sélectionné, désélectionner, sinon sélectionner
                    if (selectedCategory === category.id) {
                      setSelectedCategory(null);
                    } else {
                      setSelectedCategory(category.id);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: category.color || '#3b82f6' }}
                  />
                  {category.name}
                </button>
              ))}
              <button
                onClick={() => {
                  // Toggle: si déjà sélectionné, désélectionner, sinon sélectionner
                  if (selectedCategory === "null") {
                    setSelectedCategory(null);
                  } else {
                    setSelectedCategory("null");
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                  selectedCategory === "null"
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                Autre
              </button>
            </div>
          </div>

          {/* Tableau */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="cursor-pointer select-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getIsSorted() === "asc" && " ↑"}
                        {header.column.getIsSorted() === "desc" && " ↓"}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {t("spending.table.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              {t("common.table.pagination.page", {
                  page:  table.getState().pagination.pageIndex + 1,
                  nbPage: table.getPageCount(),
                  count: table.getFilteredRowModel().rows.length
              })}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                {t("common.table.pagination.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                {t("common.table.pagination.next")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
