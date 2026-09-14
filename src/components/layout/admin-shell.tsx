"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Gavel,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Trophy,
  Users,
  UserSquare2,
  ChartBar,
  ClipboardList,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states";
import { GlobalSearch } from "./global-search";
import { useCurrentAdmin, useLogout } from "@/hooks/use-auth";
import { getToken } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/auctions", label: "Auctions", icon: Gavel },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/players", label: "Players", icon: UserSquare2 },
  { href: "/results", label: "Results", icon: ClipboardList },
  { href: "/statistics", label: "Statistics", icon: ChartBar },
  { href: "/admins", label: "Admins", icon: Shield, superAdminOnly: true },
  { href: "/docs", label: "Docs", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const { data: admin, isLoading, isError } = useCurrentAdmin();
  const logout = useLogout();

  // guard: no token, or the session was rejected -> back to login
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!getToken() || isError) {
      router.replace("/login");
    }
  }, [isError, router]);

  if (isLoading || (!admin && !isError)) {
    return <LoadingState label="Checking your session" className="min-h-screen" />;
  }

  if (!admin) return null;

  const items = NAV.filter(
    (item) => !item.superAdminOnly || admin.role === "SUPER_ADMIN"
  );

  return (
    <div className="flex min-h-screen">
      {/* mobile nav backdrop */}
      {navOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/80 lg:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface",
          "transition-transform lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-amber text-ink">
              <Gavel className="size-4" aria-hidden />
            </span>
            <span className="display text-lg leading-none text-text">
              MedianV Auction
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-0.5">
            {items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setNavOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-surface-3 font-medium text-text"
                        : "text-muted hover:bg-surface-2 hover:text-text"
                    )}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-line p-3">
          <div className="px-2 py-2">
            <p className="truncate text-sm font-medium text-text">{admin.name}</p>
            <p className="truncate text-xs text-faint">{admin.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={() => logout.mutate()}
            loading={logout.isPending}
            className="justify-start"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-ink/95 px-4 py-3 backdrop-blur">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </Button>
          <span className="display text-lg lg:hidden">MedianV Auction</span>
          <div className="ml-auto w-full max-w-md lg:ml-0">
            <GlobalSearch />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-3xl leading-tight text-text">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}
