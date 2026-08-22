import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { Dashboard } from "./views/Dashboard";
import { TasksView } from "./views/TasksView";
import { CalendarView } from "./views/CalendarView";
import { Header } from "./components/Header";

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
  component: Dashboard,
});

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "tasks",
  component: TasksView,
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "calendar",
  component: CalendarView,
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
