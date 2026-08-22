import { useEffect, useState } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Moon, Sun, Languages, LayoutDashboard, ListTodo, Calendar } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { initAgentAPI, sessionAPI } from "@/api/agentAPI";
import { cn } from "@/lib/utils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: Infinity },
  },
});

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const router = useRouterState();
  const active = router.location.pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

function Header() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { current, change } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <span className="mr-2 text-lg font-bold">{t("app.title")}</span>
        <nav className="flex items-center gap-1">
          <NavLink to="/" icon={<LayoutDashboard className="h-4 w-4" />} label={t("nav.dashboard")} />
          <NavLink to="/tasks" icon={<ListTodo className="h-4 w-4" />} label={t("nav.tasks")} />
          <NavLink to="/calendar" icon={<Calendar className="h-4 w-4" />} label={t("nav.calendar")} />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("language.label")}>
                <Languages className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => change("en")}>
                {t("language.en")} {current === "en" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => change("es")}>
                {t("language.es")} {current === "es" && "✓"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("theme.toggle")}>
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    initAgentAPI().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-save session end on page unload
  useEffect(() => {
    const handler = () => {
      sessionAPI.end();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <RouterProvider router={router} />
      </main>
    </QueryClientProvider>
  );
}
