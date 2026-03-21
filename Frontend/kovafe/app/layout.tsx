import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import "./globals.css";

const extensionNoiseGuardScript = `
  (() => {
    const shouldIgnore = (reason) => {
      const text =
        reason instanceof Error
          ? \`\${reason.message}\\n\${reason.stack ?? ""}\`
          : String(reason ?? "");

      return (
        text.includes("chrome.runtime.sendMessage() called from a webpage") &&
        text.includes("chrome-extension://")
      );
    };

    const onUnhandledRejection = (event) => {
      if (!shouldIgnore(event.reason)) return;
      event.preventDefault();
      event.stopImmediatePropagation?.();
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection, true);
  })();
`;

export const metadata: Metadata = {
  title: "Kalieso",
  description: "Social NFT marketplace on Injective",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: extensionNoiseGuardScript }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
