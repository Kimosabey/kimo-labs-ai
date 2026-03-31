import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kimo Labs",
  description: "Next-gen local AI hub for RAG and tool-use by Kimo.",
};

export const SAMPLE_QUESTIONS = [
  "What is Kimo Labs?",
  "How do I switch between the models?",
  "Analyze this code block with DeepSeek.",
  "What models are currently active?",
];

import AppShell from "@/components/layout/AppShell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
