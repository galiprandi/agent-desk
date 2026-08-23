import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { tasksAPI, linksAPI } from "@/api/agentAPI";
import type { TaskRecord } from "@/lib/db";
import { useApiRefresh } from "@/hooks/useApiRefresh";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  states: string[];
  onEditTask: (task: TaskRecord) => void;
}

export function KanbanBoard({ states, onEditTask }: KanbanBoardProps) {
  useApiRefresh();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const columns = useMemo(() => {
    const all = tasksAPI.list();
    const map: Record<string, TaskRecord[]> = {};
    for (const s of states) map[s] = [];
    for (const task of all) {
      if (map[task.status]) {
        map[task.status].push(task);
      } else {
        // status not in configured states; put in first column bucket
        map[states[0]]?.push(task);
      }
    }
    return map;
  }, [states]);

  const activeTask = activeId ? tasksAPI.get(activeId) : null;

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const taskId = active.id as string;
    const task = tasksAPI.get(taskId);
    if (!task) return;

    // over.id may be a column id or a task id
    const overId = over.id as string;
    let newStatus: string | null = null;
    if (states.includes(overId)) {
      newStatus = overId;
    } else {
      // dropped over a task -> adopt that task's status
      const overTask = tasksAPI.get(overId);
      if (overTask) newStatus = overTask.status;
    }
    if (newStatus && newStatus !== task.status) {
      tasksAPI.update(taskId, { status: newStatus });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
        {states.map((state) => (
          <KanbanColumn
            key={state}
            state={state}
            tasks={columns[state] ?? []}
            onEditTask={onEditTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} dragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  state,
  tasks,
  onEditTask,
}: {
  state: string;
  tasks: TaskRecord[];
  onEditTask: (task: TaskRecord) => void;
}) {
  const { setNodeRef } = useDroppable({ id: state });
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30" data-testid={`kanban-column-${state}`}>
      <div className="flex items-center justify-between border-b p-3">
        <span className="text-sm font-semibold capitalize">{state}</span>
        <Badge variant="secondary" data-testid={`kanban-column-count-${state}`}>{tasks.length}</Badge>
      </div>
      <div ref={setNodeRef} className="flex-1 space-y-2 p-2 min-h-[100px]">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onEditTask={onEditTask} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableTaskCard({
  task,
  onEditTask,
}: {
  task: TaskRecord;
  onEditTask: (task: TaskRecord) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-testid={`kanban-card-${task.id}`}>
      <TaskCard task={task} onEditTask={onEditTask} />
    </div>
  );
}

function TaskCard({
  task,
  onEditTask,
  dragging,
}: {
  task: TaskRecord;
  onEditTask?: (task: TaskRecord) => void;
  dragging?: boolean;
}) {
  const { t } = useTranslation();
  const backlinks = linksAPI.list({ to: task.id });

  return (
    <div
      className={cn(
        "group rounded-md border bg-card p-3 text-card-foreground shadow-sm",
        dragging && "shadow-lg"
      )}
      onClick={() => onEditTask?.(task)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{task.title}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          data-testid={`task-delete-${task.id}`}
          aria-label="Delete task"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(t("tasks.confirmDelete"))) tasksAPI.delete(task.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Badge variant="outline" className="text-xs">
          {t(`priority.${task.priority}`)}
        </Badge>
        {task.dueDate && (
          <Badge variant="secondary" className="text-xs">
            {new Date(task.dueDate).toLocaleDateString()}
          </Badge>
        )}
        {task.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            #{tag}
          </Badge>
        ))}
        {backlinks.length > 0 && (
          <Badge variant="outline" className="text-xs">
            ↗ {backlinks.length}
          </Badge>
        )}
      </div>
    </div>
  );
}
