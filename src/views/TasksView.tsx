import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Plus, ArrowUpDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskDialog } from "@/components/TaskDialog";
import { KanbanBoard } from "@/components/KanbanBoard";
import { tasksAPI, linksAPI } from "@/api/agentAPI";
import { useApiRefresh } from "@/hooks/useApiRefresh";
import { useTaskStates } from "@/hooks/useTaskStates";
import type { TaskRecord } from "@/lib/db";
import { LLMInstructions } from "@/components/LLMInstructions";

export function TasksView() {
  const { t } = useTranslation();
  useApiRefresh();
  const states = useTaskStates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRecord | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const tasks = useMemo(() => tasksAPI.list(), []);

  const columnHelper = createColumnHelper<TaskRecord>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: t("tasks.titleField"),
        cell: (info) => (
          <span className="font-medium">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: t("tasks.status"),
        cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
      }),
      columnHelper.accessor("priority", {
        header: t("tasks.priority"),
        cell: (info) => t(`priority.${info.getValue()}`),
      }),
      columnHelper.accessor("dueDate", {
        header: t("tasks.dueDate"),
        cell: (info) =>
          info.getValue() ? new Date(info.getValue()!).toLocaleDateString() : "—",
      }),
      columnHelper.accessor("tags", {
        header: t("tasks.tags"),
        cell: (info) => (
          <div className="flex flex-wrap gap-1">
            {info.getValue().map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        ),
      }),
    ],
    [t, columnHelper]
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (task: TaskRecord) => {
    setEditing(task);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4" data-testid="tasks-view">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="tasks-title">{t("tasks.title")}</h1>
        <Button onClick={openNew} data-testid="task-create-btn">
          <Plus className="h-4 w-4" />
          {t("tasks.new")}
        </Button>
      </div>

      <Tabs defaultValue="kanban" data-testid="tasks-view-toggle">
        <TabsList>
          <TabsTrigger value="kanban" data-testid="tasks-tab-kanban">{t("tasks.kanban")}</TabsTrigger>
          <TabsTrigger value="list" data-testid="tasks-tab-list">{t("tasks.list")}</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" data-testid="tasks-kanban-content">
          <KanbanBoard states={states} onEditTask={openEdit} />
        </TabsContent>
        <TabsContent value="list" data-testid="tasks-list-content">
          <div className="rounded-md border" data-testid="tasks-list-table">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th key={header.id} className="px-3 py-2 text-left font-medium">
                        {header.isPlaceholder ? null : (
                          <button
                            className="inline-flex items-center gap-1"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">
                      {t("tasks.empty")}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      data-testid={`task-row-${row.original.id}`}
                      className="border-t cursor-pointer hover:bg-accent/50"
                      onClick={() => openEdit(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editing} />

      <LLMInstructions view="tasks" />
    </div>
  );
}
