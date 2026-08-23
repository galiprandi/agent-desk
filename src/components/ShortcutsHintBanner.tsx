import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHORTCUTS } from "@/lib/shortcuts";

const DISMISS_KEY = "agent-desk-shortcuts-hint-dismissed";

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISMISS_KEY) === "true";
}

function setDismissed(value: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISS_KEY, String(value));
}

const GROUP_ORDER = ["navigation", "actions", "session", "ui", "data"] as const;
const GROUP_I18N: Record<string, string> = {
  navigation: "shortcuts.groups.navigation",
  actions: "shortcuts.groups.actions",
  session: "shortcuts.groups.session",
  ui: "shortcuts.groups.ui",
  data: "shortcuts.groups.data",
};

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs font-bold text-foreground"
      data-testid="kbd"
    >
      {children}
    </kbd>
  );
}

/**
 * A prominent, dismissible banner that shows the full list of keyboard
 * shortcuts grouped by category. Shows on the Dashboard (the landing page)
 * until the user dismisses it. The dismiss is persisted in localStorage so
 * it doesn't reappear on every visit.
 *
 * Per ADR-0013: has data-testid and aria-label on all interactive elements.
 */
export function ShortcutsHintBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(isDismissed());

  if (hidden) return null;

  const handleDismiss = () => {
    setDismissed(true);
    setHidden(true);
  };

  const handleView = () => {
    void navigate({ to: "/shortcuts" });
  };

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: SHORTCUTS.filter((s) => s.meta.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      data-testid="shortcuts-hint-banner"
      className="rounded-lg border border-primary/30 bg-primary/5"
      role="status"
    >
      {/* Header row */}
      <div className="flex items-center gap-3 border-b border-primary/20 px-4 py-3">
        <Keyboard className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-sm font-semibold">
            {t("shortcuts.hintBanner")}
          </span>
          <Kbd>?</Kbd>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleView}
          data-testid="shortcuts-hint-view"
          aria-label={t("shortcuts.hintView")}
          className="shrink-0"
        >
          {t("shortcuts.hintView")}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          data-testid="shortcuts-hint-dismiss"
          aria-label={t("shortcuts.hintDismiss")}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Shortcut list */}
      <div
        data-testid="shortcuts-hint-list"
        className="grid gap-4 px-4 py-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {grouped.map(({ group, items }) => (
          <div
            key={group}
            data-testid={`shortcuts-hint-group-${group}`}
            className="space-y-1.5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(GROUP_I18N[group])}
            </p>
            <ul className="space-y-1">
              {items.map((s) => (
                <li
                  key={s.id}
                  data-testid={`shortcuts-hint-row-${s.id}`}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="inline-flex items-center gap-1">
                    {s.display.split(" ").map((part, i) => (
                      <span key={i} className="inline-flex items-center gap-0.5">
                        {i > 0 && (
                          <span className="text-muted-foreground">→</span>
                        )}
                        <Kbd>{part}</Kbd>
                      </span>
                    ))}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {t(`shortcuts.${s.i18nKey}.name`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
