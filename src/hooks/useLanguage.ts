import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { setLanguage, type Language } from "@/i18n";

export function useLanguage() {
  const { i18n } = useTranslation();
  const current = (i18n.language?.startsWith("es") ? "es" : "en") as Language;

  const change = useCallback((lang: Language) => {
    setLanguage(lang);
  }, []);

  const toggle = useCallback(() => {
    setLanguage(current === "es" ? "en" : "es");
  }, [current]);

  return { current, change, toggle };
}
