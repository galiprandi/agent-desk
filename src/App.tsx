import { useEffect, useState } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { router } from "./router";
import { initAgentAPI, sessionAPI } from "@/api/agentAPI";
import { useAutoExport, flushAutosave } from "@/hooks/useAutoExport";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: Infinity },
  },
});

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

  // Silent periodic backup to localStorage (ADR-0016). No-op until ready.
  useAutoExport();

  // Auto-save session end + final snapshot on page unload
  useEffect(() => {
    const handler = () => {
      sessionAPI.end();
      flushAutosave();
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
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
