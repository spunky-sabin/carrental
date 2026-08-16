"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppScreen, Icon } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";

export default function AdminSidebar({ profile }: { profile?: UserProfile | null }) {
  const pathname = usePathname();
  const nav = [
    { href: "/admin", label: "Dashboard", icon: "home" },
    { href: "/admin/users", label: "User management", icon: "user" },
    { href: "/admin/car-listings", label: "Car listings", icon: "car" },
    { href: "/admin/owner-applications", label: "Owner applications", icon: "briefcase" },
  ];

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col gap-6 lg:flex">
      <div
        className="flex flex-col gap-1 rounded-2xl border p-3"
        style={{ background: "#ffffff", borderColor: "#d7d7d7" }}
      >
        <h2
          className="px-2.5 py-2 text-[12px] font-semibold uppercase tracking-wide"
          style={{ color: "#7f7f7f" }}
        >
          Admin dashboard
        </h2>
        <nav aria-label="Admin dashboard navigation" className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors"
                style={{
                  background: isActive ? "#ededed" : "transparent",
                  color: "#000000",
                }}
              >
                <Icon name={item.icon as any} size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        onClick={async () => {
          try {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/";
          } catch (err) {
            console.error("Logout error:", err);
          }
        }}
        className="flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-[13.5px] font-medium transition-colors hover:bg-[#ededed]"
        style={{ borderColor: "#d7d7d7", color: "#000000", background: "#ffffff" }}
      >
        <Icon name="logout" size={17} />
        <span>Log out</span>
      </button>
    </aside>
  );
}
