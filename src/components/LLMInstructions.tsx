import { useTranslation } from "react-i18next";

export type LLMViewName = "dashboard" | "tasks" | "calendar" | "shortcuts";

interface LLMInstructionsProps {
  view: LLMViewName;
}

/**
 * Renders hidden API usage instructions for AI agents (ADR-0014).
 *
 * The content is present in the DOM (readable via snapshot/eval) but visually
 * hidden from humans using the "visually-hidden" CSS pattern (NOT display:none,
 * which some agents skip). The text is bilingual based on the i18n setting.
 */
export function LLMInstructions({ view }: LLMInstructionsProps) {
  const { t } = useTranslation();
  const lines = t(`llmInstructions.${view}`, { returnObjects: true }) as string[];
  const title = t("llmInstructions.title");

  if (!Array.isArray(lines)) return null;

  return (
    <section
      data-testid="llm-instructions"
      data-view={view}
      className="sr-only-llm"
      aria-hidden="true"
    >
      <h2>{title}</h2>
      <ul>
        {lines.map((line, idx) => (
          <li key={idx}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
