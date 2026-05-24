// Example: Data Table with Sorting and Filtering
// Demonstrates: Table composition, TanStack Table integration, responsive design

"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define data type
export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "viewer";
  status: "active" | "inactive";
};

// Sample data
const data: User[] = [
  {
    email: "alice@example.com",
    id: "1",
    name: "Alice Johnson",
    role: "admin",
    status: "active",
  },
  {
    email: "bob@example.com",
    id: "2",
    name: "Bob Smith",
    role: "user",
    status: "active",
  },
  {
    email: "carol@example.com",
    id: "3",
    name: "Carol White",
    role: "viewer",
    status: "inactive",
  },
];

// Define columns
export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
    header: ({ column }) => {
      return (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    header: ({ column }) => {
      return (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "role",
    cell: ({ row }) => <div className="capitalize">{row.getValue("role")}</div>,
    header: "Role",
  },
  {
    accessorKey: "status",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
    header: "Status",
  },
  {
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8 p-0" variant="ghost">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id)}
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View user</DropdownMenuItem>
            <DropdownMenuItem>Edit user</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableHiding: false,
    id: "actions",
  },
];

export function DataTableExample() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      rowSelection,
      sorting,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          className="max-w-sm"
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          placeholder="Filter names..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="ml-auto" variant="outline">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    checked={column.getIsVisible()}
                    className="capitalize"
                    key={column.id}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            size="sm"
            variant="outline"
          >
            Previous
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            size="sm"
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Key Patterns Demonstrated:
 *
 * 1. TanStack Table Integration: Using @tanstack/react-table with shadcn/ui
 * 2. Sorting: Click headers to sort ascending/descending
 * 3. Filtering: Text input to filter table data
 * 4. Column Visibility: Toggle columns via dropdown menu
 * 5. Pagination: Built-in pagination controls
 * 6. Row Actions: Dropdown menu per row for context actions
 * 7. Responsive Design: Table adapts to different screen sizes
 *
 * Required Dependencies:
 * - @tanstack/react-table
 * - lucide-react
 *
 * Installation:
 * npx shadcn@latest add table
 * npx shadcn@latest add button
 * npx shadcn@latest add input
 * npx shadcn@latest add dropdown-menu
 * npm install @tanstack/react-table lucide-react
 */
