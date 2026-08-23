import { useTranslation } from "react-i18next";
import { useHotkeyRegistrations } from "@tanstack/react-hotkeys";
import { SHORTCUTS } from "@/lib/shortcuts";
import { LLMInstructions } from "@/components/LLMInstructions";

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
      className="inline-flex min-w-[2rem] items-center justify-center rounded border border-border bg-muted px-2 py-1 font-mono text-sm font-medium text-foreground"
      data-testid="kbd"
    >
      {children}
    </kbd>
  );
}

export function ShortcutsView() {
  const { t } = useTranslation();
  // Live registrations from TanStack Hotkeys — reflects what's actually
  // registered, not just our static definitions.
  const { hotkeys, sequences } = useHotkeyRegistrations();

  // Group our static definitions by group field
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: SHORTCUTS.filter((s) => s.meta.group === group),
  })).filter((g) => g.items.length > 0);

  // Count live registrations for a status indicator
  const totalRegistered = hotkeys.length + sequences.length;

  return (
    <div data-testid="shortcuts-view" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 data-testid="shortcuts-title" className="text-2xl font-bold">
          {t("shortcuts.title")}
        </h1>
        <span data-testid="shortcuts-count" className="text-sm text-muted-foreground">
          {t("shortcuts.registered", { count: totalRegistered })}
        </span>
      </div>

      <p data-testid="shortcuts-description" className="text-muted-foreground">
        {t("shortcuts.description")}
      </p>

      {grouped.map(({ group, items }) => (
        <section key={group} data-testid={`shortcuts-group-${group}`} className="space-y-3">
          <h2 className="text-lg font-semibold">{t(GROUP_I18N[group])}</h2>
          <div className="overflow-hidden rounded-lg border">
            <table data-testid={`shortcuts-table-${group}`} className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                    {t("shortcuts.columns.key")}
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                    {t("shortcuts.columns.action")}
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                    {t("shortcuts.columns.description")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr
                    key={s.id}
                    data-testid={`shortcut-row-${s.id}`}
                    className="border-t"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        {s.display.split(" ").map((part, i) => (
                          <span key={i} className="inline-flex items-center gap-1">
                            {i > 0 && <span className="text-muted-foreground">→</span>}
                            <Kbd>{part}</Kbd>
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {t(`shortcuts.${s.i18nKey}.name`)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {t(`shortcuts.${s.i18nKey}.description`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <LLMInstructions view="shortcuts" />
    </div>
  );
}
