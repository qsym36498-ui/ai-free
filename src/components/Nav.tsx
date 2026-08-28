"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/chat", label: "المساعد الذكي" },
  { href: "/generator", label: "مولد الأكواد" },
  { href: "/lessons", label: "الدروس" },
  { href: "/train", label: "غرفة التدريب" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-mint/40 bg-panel font-mono text-lg font-bold text-mint shadow-[0_0_18px_rgba(61,220,151,0.25)]">
            ل
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-fog">عقل لواو</span>
            <span className="block font-mono text-[10px] text-dim" dir="ltr">
              Luau Mind AI
            </span>
          </span>
        </Link>

        <nav
          aria-label="التنقل الرئيسي"
          className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-0.5 text-sm"
        >
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  "shrink-0 rounded-md px-3 py-1.5 transition " +
                  (active
                    ? "bg-panel2 font-bold text-mint"
                    : "text-dim hover:bg-panel2 hover:text-mint")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
