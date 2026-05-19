import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { CommandPalette } from "@/components/CommandPalette";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContractLens AI — пойми любой договор за 30 секунд",
  description:
    "AI-ассистент, который анализирует юридические документы, подсвечивает риски и объясняет всё простым языком.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className="min-h-screen flex flex-col bg-bg text-ink antialiased">
        <ToastProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CommandPalette />
        </ToastProvider>
      </body>
    </html>
  );
}
