import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppShell from "@/components/layout/AppShell";
import SmoothScroll from "@/components/layout/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kimo Labs | Multimodal Hub",
  description: "Advanced local intelligence workbench for ASR, TTS, and Agentic RAG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground overflow-hidden h-full" suppressHydrationWarning>
        <SmoothScroll>
          <TooltipProvider>
            <AppShell>
              {children}
            </AppShell>
          </TooltipProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
