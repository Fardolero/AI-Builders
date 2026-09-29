"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Home,
  MessageCircle,
  Plus,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { APP_NAME, ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";

type TrocarShellProps = {
  children: ReactNode;
  className?: string;
  showNav?: boolean;
  showTabs?: boolean;
  greeting?: string;
  title?: string;
  subtitle?: string;
  profileHref?: string;
  profileInitials?: string;
  rightSlot?: ReactNode;
};

const TABS = [
  { href: ROUTES.feed, label: "Inicio", icon: Home },
  { href: ROUTES.exchanges, label: "Chats", icon: MessageCircle },
  { href: ROUTES.postsNew, label: "Publicar", icon: Plus, prominent: true },
  { href: ROUTES.saved, label: "Guardados", icon: Bookmark },
  { href: ROUTES.profile, label: "Perfil", icon: UserRound },
] as const;

function isTabActive(pathname: string, href: string) {
  if (href === ROUTES.feed) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TrocarShell({
  children,
  className,
  showNav = true,
  showTabs = false,
  greeting,
  title,
  subtitle,
  profileHref = ROUTES.profile,
  profileInitials,
  rightSlot,
}: TrocarShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#d7e6df]">
      <div
        className={cn(
          "relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-trocar-mist text-trocar-paper shadow-[0_30px_80px_-40px_rgba(14,58,44,0.45)] md:max-w-3xl lg:max-w-5xl",
          className,
        )}
      >
        {showNav ? (
          <header className="trocar-header trocar-grain px-5 pt-6 pb-14 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                {greeting || title ? (
                  <>
                    {greeting ? (
                      <p className="text-xs tracking-[0.18em] text-white/70 uppercase">
                        {greeting}
                      </p>
                    ) : null}
                    {title ? (
                      <p className="truncate font-[family-name:var(--font-display)] text-2xl font-bold">
                        {title}
                      </p>
                    ) : null}
                    {subtitle ? (
                      <p className="mt-1 text-sm text-white/70">{subtitle}</p>
                    ) : null}
                  </>
                ) : (
                  <Link
                    href={ROUTES.home}
                    className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight"
                  >
                    {APP_NAME}
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-white/85 [&_a]:text-white/85 [&_a:hover]:text-white">
                {showTabs ? (
                  <Link
                    href={profileHref}
                    className="trocar-glass trocar-grain relative inline-flex size-11 items-center justify-center rounded-full text-sm font-bold text-white"
                    aria-label="Perfil"
                  >
                    {profileInitials ? (
                      profileInitials
                    ) : (
                      <UserRound className="size-4" />
                    )}
                  </Link>
                ) : (
                  rightSlot
                )}
              </div>
            </div>
          </header>
        ) : null}

        <main
          className={cn(
            "flex-1 px-5",
            showNav ? "-mt-8 rounded-t-[2rem] bg-trocar-mist pt-6" : "pt-5",
            showTabs ? "pb-28" : "pb-10",
          )}
        >
          {children}
        </main>

        {showTabs ? (
          <nav
            aria-label="Navegación principal"
            className="trocar-glass trocar-grain fixed bottom-4 left-1/2 z-20 grid w-[min(42rem,calc(100%-2rem))] -translate-x-1/2 grid-cols-5 items-end rounded-full px-1.5 py-2 text-white lg:w-[min(48rem,calc(100%-2rem))]"
          >
            {TABS.map((tab) => {
              const active = isTabActive(pathname, tab.href);
              const Icon = tab.icon;
              const prominent = "prominent" in tab && tab.prominent;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={prominent ? tab.label : undefined}
                  className={cn(
                    "flex min-w-0 flex-col items-center gap-1 rounded-full px-0.5 py-1 text-[10px] leading-none font-medium",
                    active ? "text-trocar-mint" : "text-white/70",
                  )}
                >
                  {prominent ? (
                    <span className="relative h-5 w-full">
                      <span
                        className={cn(
                          "trocar-glass-mint trocar-grain absolute bottom-0 left-1/2 flex size-12 -translate-x-1/2 items-center justify-center rounded-full text-trocar-ink",
                          active && "ring-2 ring-white",
                        )}
                      >
                        <Icon className="size-6" aria-hidden />
                      </span>
                    </span>
                  ) : (
                    <Icon className="size-5" aria-hidden />
                  )}
                  <span className="max-w-full truncate">{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
