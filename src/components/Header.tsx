import React from "react";
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
import { cn } from "@/lib/utils";

function NavLink({ to, icon, label, testId }: { to: string; icon: React.ReactNode; label: string; testId: string }) {
  const router = useRouterState();
  const active = router.location.pathname === to;
  return (
    <Link
      to={to}
      data-testid={testId}
      data-active={active}
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

export function Header() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { current, change } = useLanguage();

  return (
    <header data-testid="app-header" className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <span data-testid="app-title" className="mr-2 text-lg font-bold">{t("app.title")}</span>
        <nav data-testid="app-nav" className="flex items-center gap-1">
          <NavLink to="/" testId="nav-dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label={t("nav.dashboard")} />
          <NavLink to="/tasks" testId="nav-tasks" icon={<ListTodo className="h-4 w-4" />} label={t("nav.tasks")} />
          <NavLink to="/calendar" testId="nav-calendar" icon={<Calendar className="h-4 w-4" />} label={t("nav.calendar")} />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("language.label")} data-testid="language-toggle">
                <Languages className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-testid="language-menu">
              <DropdownMenuItem data-testid="language-en" onClick={() => change("en")}>
                {t("language.en")} {current === "en" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="language-es" onClick={() => change("es")}>
                {t("language.es")} {current === "es" && "✓"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("theme.toggle")} data-testid="theme-toggle">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
