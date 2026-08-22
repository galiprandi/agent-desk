import { useEffect, useState } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { router } from "./router";
import { initAgentAPI, sessionAPI } from "@/api/agentAPI";

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
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
