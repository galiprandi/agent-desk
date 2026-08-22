import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  addMonths,
  addWeeks,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
} from "date-fns";
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EventDialog } from "@/components/EventDialog";
import { eventsAPI } from "@/api/agentAPI";
import { useApiRefresh } from "@/hooks/useApiRefresh";
import type { EventRecord } from "@/lib/db";
import { cn } from "@/lib/utils";
import { LLMInstructions } from "@/components/LLMInstructions";

type ViewMode = "month" | "week" | "day";

export function CalendarView() {
  const { t } = useTranslation();
  useApiRefresh();
  const [mode, setMode] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EventRecord | null>(null);
  const [defaultStart, setDefaultStart] = useState<string | undefined>();

  const events = useMemo(() => eventsAPI.list(), []);

  const openNew = (start?: Date) => {
    setEditing(null);
    setDefaultStart(start ? start.toISOString() : undefined);
    setDialogOpen(true);
  };
  const openEdit = (event: EventRecord) => {
    setEditing(event);
    setDefaultStart(undefined);
    setDialogOpen(true);
  };

  const prev = () =>
    setCursor((c) =>
      mode === "month" ? addMonths(c, -1) : mode === "week" ? addWeeks(c, -1) : addDays(c, -1)
    );
  const next = () =>
    setCursor((c) =>
      mode === "month" ? addMonths(c, 1) : mode === "week" ? addWeeks(c, 1) : addDays(c, 1)
    );

  const headerLabel = useMemo(() => {
    if (mode === "month") return format(cursor, "MMMM yyyy");
    if (mode === "week") {
      const s = startOfWeek(cursor, { weekStartsOn: 1 });
      const e = endOfWeek(cursor, { weekStartsOn: 1 });
      return `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}`;
    }
    return format(cursor, "EEEE, MMM d, yyyy");
  }, [mode, cursor]);

  return (
    <div className="space-y-4" data-testid="calendar-view">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="calendar-title">{t("calendar.title")}</h1>
        <Button onClick={() => openNew()} data-testid="event-create-btn">
          <Plus className="h-4 w-4" />
          {t("calendar.new")}
        </Button>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as ViewMode)} data-testid="calendar-view-switcher">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="month" data-testid="calendar-tab-month">{t("calendar.month")}</TabsTrigger>
            <TabsTrigger value="week" data-testid="calendar-tab-week">{t("calendar.week")}</TabsTrigger>
            <TabsTrigger value="day" data-testid="calendar-tab-day">{t("calendar.day")}</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prev} data-testid="calendar-prev" aria-label={t("calendar.prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium" data-testid="calendar-header-label">{headerLabel}</span>
            <Button variant="outline" size="icon" onClick={next} data-testid="calendar-next" aria-label={t("calendar.next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              data-testid="calendar-today"
              onClick={() => {
                setCursor(new Date());
              }}
            >
              {t("calendar.today")}
            </Button>
          </div>
        </div>

        <TabsContent value="month" data-testid="calendar-month-content">
          <MonthView cursor={cursor} events={events} onEdit={openEdit} onNew={openNew} />
        </TabsContent>
        <TabsContent value="week" data-testid="calendar-week-content">
          <WeekView cursor={cursor} events={events} onEdit={openEdit} onNew={openNew} />
        </TabsContent>
        <TabsContent value="day" data-testid="calendar-day-content">
          <DayView cursor={cursor} events={events} onEdit={openEdit} onNew={openNew} />
        </TabsContent>
      </Tabs>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editing}
        defaultStart={defaultStart}
      />

      <LLMInstructions view="calendar" />
    </div>
  );
}

function eventsOnDay(events: EventRecord[], day: Date): EventRecord[] {
  return events.filter((e) => isSameDay(parseISO(e.start), day));
}

function MonthView({
  cursor,
  events,
  onEdit,
  onNew,
}: {
  cursor: Date;
  events: EventRecord[];
  onEdit: (e: EventRecord) => void;
  onNew: (d: Date) => void;
}) {
  const { t } = useTranslation();
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="rounded-md border" data-testid="calendar-month-grid">
      <div className="grid grid-cols-7 border-b bg-muted/50 text-xs font-medium">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="p-2 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const dayEvents = eventsOnDay(events, day);
          return (
            <div
              key={day.toISOString()}
              data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
              className={cn(
                "min-h-[90px] border-r border-b p-1 last:border-r-0",
                !inMonth && "bg-muted/20 text-muted-foreground"
              )}
              onDoubleClick={() => onNew(day)}
            >
              <div className="text-right text-xs">{format(day, "d")}</div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <EventPill key={e.id} event={e} onClick={() => onEdit(e)} />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">+{dayEvents.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="p-2 text-xs text-muted-foreground">{t("calendar.new")} — double-click a day</p>
    </div>
  );
}

function WeekView({
  cursor,
  events,
  onEdit,
  onNew,
}: {
  cursor: Date;
  events: EventRecord[];
  onEdit: (e: EventRecord) => void;
  onNew: (d: Date) => void;
}) {
  const start = startOfWeek(cursor, { weekStartsOn: 1 });
  const end = endOfWeek(cursor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="grid grid-cols-7 gap-2" data-testid="calendar-week-grid">
      {days.map((day) => {
        const dayEvents = eventsOnDay(events, day);
        return (
          <div
            key={day.toISOString()}
            data-testid={`calendar-week-day-${format(day, "yyyy-MM-dd")}`}
            className="min-h-[200px] rounded-md border p-2"
            onDoubleClick={() => onNew(day)}
          >
            <div className="mb-2 text-center text-sm font-medium">
              {format(day, "EEE d")}
            </div>
            <div className="space-y-1">
              {dayEvents.map((e) => (
                <EventPill key={e.id} event={e} onClick={() => onEdit(e)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({
  cursor,
  events,
  onEdit,
  onNew,
}: {
  cursor: Date;
  events: EventRecord[];
  onEdit: (e: EventRecord) => void;
  onNew: (d: Date) => void;
}) {
  const { t } = useTranslation();
  const dayStart = startOfDay(cursor);
  const dayEnd = endOfDay(cursor);
  const dayEvents = events
    .filter((e) => {
      const s = parseISO(e.start);
      return s >= dayStart && s <= dayEnd;
    })
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="rounded-md border p-4" data-testid="calendar-day-view" onDoubleClick={() => onNew(cursor)}>
      {dayEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("calendar.noEvents")}</p>
      ) : (
        <div className="space-y-2">
          {dayEvents.map((e) => (
            <div
              key={e.id}
              data-testid={`event-item-${e.id}`}
              className="group flex items-center justify-between rounded-md border p-3"
              onClick={() => onEdit(e)}
            >
              <div>
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {e.allDay
                    ? t("calendar.allDay")
                    : `${format(parseISO(e.start), "HH:mm")} – ${format(parseISO(e.end), "HH:mm")}`}
                  {e.location && ` · ${e.location}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                data-testid={`event-delete-${e.id}`}
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (confirm(t("calendar.confirmDelete"))) eventsAPI.delete(e.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventPill({ event, onClick }: { event: EventRecord; onClick: () => void }) {
  return (
    <button
      data-testid={`event-pill-${event.id}`}
      onClick={onClick}
      className="group w-full truncate rounded bg-primary/10 px-1.5 py-0.5 text-left text-xs text-primary hover:bg-primary/20"
    >
      {event.allDay ? event.title : `${format(parseISO(event.start), "HH:mm")} ${event.title}`}
    </button>
  );
}
