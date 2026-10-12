"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileUser,
  Briefcase,
  Target,
  ListChecks,
  LogOut,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/modules/auth/actions";

const links = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/profile", label: "Career Profile", icon: FileUser },
  { href: "/app/graph", label: "Career Graph", icon: Network },
  { href: "/app/target-role", label: "Target Role", icon: Target },
  { href: "/app/jobs", label: "Opportunities", icon: Briefcase },
  { href: "/app/gaps", label: "Skill Gaps", icon: Target },
  { href: "/app/plan", label: "Action Plan", icon: ListChecks },
];

export function AppSidebar({
  userEmail,
  userName,
}: {
  userEmail?: string | null;
  userName?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-5 py-5">
        <Link href="/app" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center">
            <img
              src="/assets/logo.png?v=2"
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-contain"
            />
          </span>
          <span className="font-display text-lg tracking-tight text-white">
            JobX
          </span>
        </Link>
        <p className="mt-3 truncate text-xs text-[var(--muted)]">
          {userName || userEmail || "Your workspace"}
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/app" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-white font-medium text-black"
                  : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <form action={signOutAction} className="border-t border-[var(--border)] p-3">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </form>
    </aside>
  );
}
