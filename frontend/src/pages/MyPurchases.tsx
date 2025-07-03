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
import type { Purchase } from "@/types/purchase";
import type { Category } from "@/types/category";

interface PurchaseWithCategory extends Purchase {
  category?: Category;
}

export default function MyPurchases() {
  const [purchases, setPurchases] = useState<PurchaseWithCategory[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);

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
        header: "Date",
        cell: ({ row }) => {
          const date = new Date(row.getValue("date"));
          return (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {date.toLocaleDateString("fr-FR")}
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("description")}</div>
        ),
      },
      {
        accessorKey: "price",
        header: "Montant",
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("price"));
          return (
            <div className="text-right font-mono">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(amount)}
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Catégorie",
        cell: ({ row }) => {
          const category = row.getValue("category") as Category;
          if (!category) {
            return <Badge variant="outline">Sans catégorie</Badge>;
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
    []
  );

  const table = useReactTable({
    data: purchases,
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
            <div className="text-center">Chargement...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes Dépenses</h1>
        <p className="text-muted-foreground">
          Consultez et filtrez toutes vos dépenses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des dépenses</CardTitle>
          <CardDescription>
            {purchases.length} dépense{purchases.length > 1 ? "s" : ""} au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtre global */}
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans toutes les colonnes..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="max-w-sm"
            />
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
                      Aucune dépense trouvée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} sur{" "}
              {table.getPageCount()} ({table.getFilteredRowModel().rows.length}{" "}
              résultat{table.getFilteredRowModel().rows.length > 1 ? "s" : ""})
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
