import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import Nav from "@/components/Nav";
import NodeWorker from "@/components/NodeWorker";

export const metadata: Metadata = {
  title: "عقل لواو — ذكاء اصطناعي لبرمجة روبلوكس بلغة Luau",
  description:
    "مدرب لواو ذكي 100% يدوي: يولّد أكواد روبلوكس كاملة، يشرح كل التفاصيل الكبيرة والصغيرة، ويتدرّب من مساهمات اللاعبين وأجهزتهم.",
};

export const viewport: Viewport = {
  themeColor: "#0a0f0d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230a0f0d'/%3E%3Cpath d='M9 9h6v3h-3v8h3v3H9zM18 9h6v3h-3v8h3v3h-6z' fill='%233ddc97'/%3E%3C/svg%3E"
        />
      </head>
      <body className="min-h-screen bg-ink text-fog antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-50 focus:rounded-lg focus:bg-mint focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink"
        >
          تخطَّ إلى المحتوى
        </a>
        <Nav />
        <NodeWorker />
        <main id="main">{children}</main>
        <footer className="mt-20 border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-dim sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="font-bold text-mint">عقل لواو</span> — نموذج مبرمج يدوياً من
              الصفر، بدون أي API خارجي.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="transition hover:text-mint">
                الخصوصية والمساهمة
              </Link>
              <p className="font-mono text-xs" dir="ltr">
                while true do learn() end
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
