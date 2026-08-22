import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tasksAPI, eventsAPI, sessionAPI, configAPI } from "@/api/agentAPI";
import { useApiRefresh } from "@/hooks/useApiRefresh";
import { useTaskStates } from "@/hooks/useTaskStates";
import type { TaskRecord } from "@/lib/db";
import { isToday, isPast, parseISO, format } from "date-fns";
import { LLMInstructions } from "@/components/LLMInstructions";

const PRIORITY_ORDER: Record<TaskRecord["priority"], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function Dashboard() {
  const { t } = useTranslation();
  useApiRefresh();
  const states = useTaskStates();

  const attentionTasks = useMemo(() => {
    const all = tasksAPI.list();
    const now = new Date();
    return all
      .filter((task) => {
        if (!task.dueDate) return false;
        const due = parseISO(task.dueDate);
        return isToday(due) || isPast(due);
      })
      .filter((task) => !isDoneState(task.status, states))
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }, [states]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventsAPI
      .list({ from: now.toISOString(), to: in7.toISOString() })
      .slice(0, 5);
  }, []);

  const lastSession = useMemo(() => sessionAPI.get(), []);

  const activeTasks = useMemo(() => {
    const all = tasksAPI.list();
    return all.filter((task) => !isDoneState(task.status, states));
  }, [states]);

  return (
    <div className="space-y-6" data-testid="dashboard-view">
      <h1 className="text-2xl font-bold" data-testid="dashboard-title">{t("nav.dashboard")}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="requires-attention">
          <CardHeader>
            <CardTitle>{t("dashboard.requiresAttention")}</CardTitle>
            <CardDescription>{t("app.tagline")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {attentionTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.noAttention")}</p>
            ) : (
              attentionTasks.map((task) => (
                <div
                  key={task.id}
                  data-testid={`attention-task-${task.id}`}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.dueDate && format(parseISO(task.dueDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant="secondary">{t(`priority.${task.priority}`)}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card data-testid="upcoming-events">
          <CardHeader>
            <CardTitle>{t("dashboard.upcomingEvents")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.noEvents")}</p>
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  data-testid={`upcoming-event-${event.id}`}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(event.start), "MMM d, HH:mm")}
                    </p>
                  </div>
                  {event.location && (
                    <span className="text-xs text-muted-foreground">{event.location}</span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card data-testid="last-session">
          <CardHeader>
            <CardTitle>{t("dashboard.lastSession")}</CardTitle>
          </CardHeader>
          <CardContent>
            {lastSession ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {lastSession.summary || t("session.summary")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.started")}: {format(parseISO(lastSession.startedAt), "MMM d, HH:mm")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.ended")}:{" "}
                  {lastSession.endedAt
                    ? format(parseISO(lastSession.endedAt), "MMM d, HH:mm")
                    : t("dashboard.open")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("dashboard.noSession")}</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="active-tasks">
          <CardHeader>
            <CardTitle>{t("dashboard.activeTasks")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.noActiveTasks")}</p>
            ) : (
              activeTasks.slice(0, 8).map((task) => (
                <div
                  key={task.id}
                  data-testid={`active-task-${task.id}`}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <LLMInstructions view="dashboard" />
    </div>
  );
}

function isDoneState(status: string, states: string[]): boolean {
  // treat the last state (typically "done") and any "done"/"closed" as done
  const lower = status.toLowerCase();
  if (lower === "done" || lower === "closed") return true;
  return states.indexOf(status) === states.length - 1 && lower !== "backlog";
}
