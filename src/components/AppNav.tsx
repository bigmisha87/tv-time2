"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  {
    href: "/",
    label: "Up Next",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972L6.917 19.333a1.125 1.125 0 0 1-1.667-.986V5.653Z"
      />
    ),
  },
  {
    href: "/shows",
    label: "My Shows",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
      />
    ),
  },
  {
    href: "/calendar",
    label: "Upcoming",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
    ),
  },
  {
    href: "/discover",
    label: "Discover",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9.813 9.813 4.374 4.374m-4.374-4.374L7.5 16.5l6.687-2.313m-4.374-4.374L16.5 7.5l-2.313 6.687M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    ),
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function AppNav({
  newEpisodeDates = [],
}: {
  newEpisodeDates?: string[];
}) {
  const pathname = usePathname();
  const [newCount, setNewCount] = useState(0);

  // The badge count lives client-side so "mark as seen" and the alerts
  // toggle (both stored per device) can clear or hide it instantly.
  const datesKey = newEpisodeDates.join(",");
  useEffect(() => {
    function recompute() {
      let enabled = true;
      let lastSeen = "";
      try {
        enabled = localStorage.getItem("notify-badge") !== "off";
        lastSeen = localStorage.getItem("neweps-seen") ?? "";
      } catch {}
      setNewCount(
        enabled ? newEpisodeDates.filter((d) => d > lastSeen).length : 0
      );
    }
    recompute();
    window.addEventListener("tvtime:settings", recompute);
    return () => window.removeEventListener("tvtime:settings", recompute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datesKey]);

  return (
    <>
      {/* Desktop: top bar */}
      <header className="sticky top-0 z-20 hidden border-b border-border-app bg-surface/90 backdrop-blur md:block">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-8 px-4">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-accent">
            TV&nbsp;TIME&nbsp;2
          </Link>
          <nav className="flex gap-6">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative text-sm font-medium transition-colors ${
                  isActive(pathname, tab.href)
                    ? "text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.href === "/calendar" && newCount > 0 && (
                  <span className="ml-1.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-badge px-1 text-[11px] font-bold text-white">
                    {newCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <Link
            href="/settings"
            aria-label="Settings"
            className={`ml-auto transition-colors ${
              isActive(pathname, "/settings")
                ? "text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.241.437-.613.43-.992a7.6 7.6 0 0 1 0-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </Link>
        </div>
      </header>

      {/* Mobile: bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border-app bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="flex">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <span className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={active ? 2 : 1.5}
                    className="h-6 w-6"
                  >
                    {tab.icon}
                  </svg>
                  {tab.href === "/calendar" && newCount > 0 && (
                    <span className="absolute -right-2 -top-1 inline-flex min-w-[1.05rem] items-center justify-center rounded-full bg-badge px-1 text-[10px] font-bold text-white">
                      {newCount}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
