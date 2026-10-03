"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { NotifyToggle } from "@/components/ReminderWatcher";

type Role = "admin" | "team_lead" | "caller";
type Item = { href: string; label: string; roles?: Role[]; badge?: "due" };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Calling",
    items: [
      { href: "/queue", label: "My Queue" },
      { href: "/callbacks", label: "Callbacks & tasks", badge: "due" },
      { href: "/leads", label: "Leads" },
    ],
  },
  {
    title: "Selling",
    items: [
      { href: "/deals", label: "Deals" },
      { href: "/meetings", label: "Meetings" },
    ],
  },
  {
    title: "Team",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/reports", label: "Reports" },
      { href: "/calls", label: "Call log" },
      { href: "/lists", label: "Call lists", roles: ["admin", "team_lead"] },
      { href: "/import", label: "Import leads", roles: ["admin", "team_lead"] },
    ],
  },
  {
    title: "Resources",
    items: [
      { href: "/scripts", label: "Scripts & objections" },
      { href: "/templates", label: "Email templates" },
      { href: "/dnc", label: "Do-not-call list" },
      { href: "/zoom", label: "Zoom call-log sync", roles: ["admin", "team_lead"] },
      { href: "/settings", label: "Settings", roles: ["admin"] },
    ],
  },
];

const ROLE_LABEL: Record<Role, string> = { admin: "Admin", team_lead: "Team lead", caller: "Caller" };

export function Nav({ user, dueCount }: { user: { name: string; role: Role }; dueCount: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const body = (
    <nav aria-label="Main" className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <Link href="/" className="px-2 text-lg font-semibold tracking-tight">
        ParaTech <span className="text-copper">CRM</span>
      </Link>
      {GROUPS.map((g) => {
        const items = g.items.filter((i) => !i.roles || i.roles.includes(user.role));
        if (items.length === 0) return null;
        return (
          <div key={g.title}>
            <div className="faint mb-1 px-2 uppercase tracking-wider">{g.title}</div>
            <ul className="space-y-0.5">
              {items.map((i) => {
                const active = path === i.href || path.startsWith(i.href + "/");
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                        active ? "bg-copper/15 text-copper-light" : "text-soft hover:bg-hover hover:text-cloud"
                      }`}
                    >
                      {i.label}
                      {i.badge === "due" && dueCount > 0 && (
                        <span className="rounded-full bg-copper px-1.5 text-xs font-semibold text-obsidian" aria-label={`${dueCount} due`}>
                          {dueCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      <div className="mt-auto border-t border-line pt-4">
        <Link href="/profile" className="block rounded-lg px-2.5 py-1.5 hover:bg-hover" onClick={() => setOpen(false)}>
          <div className="text-sm font-medium">{user.name}</div>
          <div className="faint">{ROLE_LABEL[user.role]} · profile</div>
        </Link>
        <NotifyToggle />
        <form action={logoutAction}>
          <button className="btn btn-ghost btn-sm mt-1 w-full justify-start px-2.5 text-soft" type="submit">Sign out</button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-line bg-deep px-4 py-3 lg:hidden">
        <span className="font-semibold">ParaTech <span className="text-copper">CRM</span></span>
        <button className="btn btn-sm" aria-expanded={open} aria-controls="side-nav" onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      <aside id="side-nav" className={`${open ? "block" : "hidden"} border-b border-line bg-deep lg:sticky lg:top-0 lg:block lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r`}>
        {body}
      </aside>
    </>
  );
}
