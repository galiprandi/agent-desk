import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { Header } from "./components/Header";

const Dashboard = lazy(() =>
  import("./views/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const TasksView = lazy(() =>
  import("./views/TasksView").then((m) => ({ default: m.TasksView }))
);
const CalendarView = lazy(() =>
  import("./views/CalendarView").then((m) => ({ default: m.CalendarView }))
);

function ViewLoader({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div>Loading…</div>}>{children}</Suspense>;
}

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <ViewLoader>
      <Dashboard />
    </ViewLoader>
  ),
});

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "tasks",
  component: () => (
    <ViewLoader>
      <TasksView />
    </ViewLoader>
  ),
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "calendar",
  component: () => (
    <ViewLoader>
      <CalendarView />
    </ViewLoader>
  ),
});

const routeTree = rootRoute.addChildren([indexRoute, tasksRoute, calendarRoute]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
