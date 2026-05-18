import type { Metadata } from "next";
import Link from "next/link";
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
    <html lang="ru">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">
              ContractLens<span className="text-neutral-400"> AI</span>
            </Link>
            <nav className="flex gap-6 text-sm text-neutral-600">
              <Link href="/" className="hover:text-neutral-900">
                Главная
              </Link>
              <Link href="/documents" className="hover:text-neutral-900">
                История
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-4 text-xs text-neutral-500">
            Это не юридическая консультация — инструмент анализа документа.
          </div>
        </footer>
      </body>
    </html>
  );
}
