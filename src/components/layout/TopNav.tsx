"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface Props {
  user: { name: string };
}

const NAV_LINKS = [
  { href: "/collection", label: "Collection" },
  { href: "/trade/compare", label: "Compare" },
  { href: "/trade", label: "Trades" },
  { href: "/settings", label: "Settings" },
];

export function TopNav({ user }: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/trade"
      ? pathname === "/trade" || (pathname.startsWith("/trade/") && !pathname.startsWith("/trade/compare"))
      : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 bg-panini-navy/95 backdrop-blur border-b border-panini-blue/30">
      {/* Top row */}
      <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-14">
        <Link
          href="/collection"
          className="flex items-center gap-2.5 font-display text-2xl font-bold text-panini-gold tracking-wider hover:text-panini-gold-lt transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/2/2c/2026_FIFA_World_Cup_emblem_%28with_wordmark%29.svg"
            alt="2026 FIFA World Cup emblem"
            className="h-9 w-auto"
          />
          PANINI WC26
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? "bg-panini-blue text-panini-white"
                  : "text-panini-gray hover:text-panini-white hover:bg-panini-blue/30"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-panini-gray text-sm hidden sm:block">{user.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-panini-gray hover:text-panini-red transition-colors px-2 py-1 rounded"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="md:hidden flex border-t border-panini-blue/20">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 text-center py-2 text-xs font-medium transition-colors ${
              isActive(href)
                ? "text-panini-gold border-b-2 border-panini-gold"
                : "text-panini-gray hover:text-panini-white"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
