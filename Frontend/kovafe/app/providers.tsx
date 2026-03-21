"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { privyAppId, privyConfig } from "@/lib/privy";
import wagmiConfig from "@/lib/wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRealtime } from "@/hooks/useRealtime";

function RealtimeBootstrap() {
  useRealtime();
  return null;
}

function ExtensionNoiseGuard() {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error
          ? `${event.reason.message}\n${event.reason.stack ?? ""}`
          : String(event.reason ?? "");

      const isExtensionRuntimeError =
        reason.includes("chrome.runtime.sendMessage() called from a webpage") &&
        reason.includes("chrome-extension://");

      if (!isExtensionRuntimeError) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" forcedTheme="dark">
      <PrivyProvider appId={privyAppId} config={privyConfig}>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            <ExtensionNoiseGuard />
            <RealtimeBootstrap />
            <AppLayout>{children}</AppLayout>
            <Toaster position="top-right" richColors />
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ThemeProvider>
  );
}
