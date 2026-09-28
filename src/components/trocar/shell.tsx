"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  Plus,
  Home,
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
  { href: ROUTES.profile, label: "Perfil", icon: UserRound },
] as const;

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
          <header className="trocar-header px-5 pt-6 pb-14 text-white">
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
                    className="inline-flex size-11 items-center justify-center rounded-full bg-white/15 text-sm font-bold"
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
          <nav className="fixed bottom-4 left-1/2 z-20 flex w-[min(42rem,calc(100%-2rem))] -translate-x-1/2 items-end justify-between rounded-full bg-trocar-ink px-2 py-2 text-white shadow-lg lg:w-[min(48rem,calc(100%-2rem))]">
            {TABS.map((tab) => {
              const active =
                pathname === tab.href ||
                (tab.href !== ROUTES.feed && pathname.startsWith(tab.href));
              const Icon = tab.icon;
              if ("prominent" in tab && tab.prominent) {
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    aria-label={tab.label}
                    className="-mt-5 inline-flex size-14 items-center justify-center rounded-full bg-trocar-mint text-trocar-ink shadow-lg"
                  >
                    <Icon className="size-6" aria-hidden />
                  </Link>
                );
              }
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-1.5 text-[10px] font-medium",
                    active ? "text-trocar-mint" : "text-white/70",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
