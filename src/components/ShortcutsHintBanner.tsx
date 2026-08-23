import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "agent-desk-shortcuts-hint-dismissed";

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISMISS_KEY) === "true";
}

function setDismissed(value: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISS_KEY, String(value));
}

/**
 * A prominent, dismissible banner that tells users to press ? to see all
 * keyboard shortcuts. Shows on the Dashboard (the landing page) until the
 * user dismisses it. The dismiss is persisted in localStorage so it doesn't
 * reappear on every visit.
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

  return (
    <div
      data-testid="shortcuts-hint-banner"
      className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3"
      role="status"
    >
      <Keyboard className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-sm font-medium">
          {t("shortcuts.hintBanner")}
        </span>
        <kbd
          className="inline-flex min-w-[1.75rem] items-center justify-center rounded border border-border bg-background px-2 py-0.5 font-mono text-sm font-bold text-primary"
          aria-hidden="true"
        >
          ?
        </kbd>
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
  );
}
