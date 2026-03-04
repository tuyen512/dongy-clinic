import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export function DashboardShell({
  activePath,
  title,
  subtitle,
  actions,
  children
}: {
  activePath: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar activePath={activePath} />
      <section className="flex-1">
        <header className="flex items-center justify-between border-b border-[#1a345d] px-6 py-5">
          <h1 className="text-xl font-semibold">Hệ thống Quản lý Phòng khám</h1>
          <div className="h-10 w-10 rounded-full border border-[#1f3b67] bg-[#082246]" />
        </header>
        <main className="space-y-6 px-6 py-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-4xl font-bold text-white">{title}</h2>
              {subtitle ? <p className="mt-1 text-2 text-sky-200/80">{subtitle}</p> : null}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </section>
    </div>
  );
}
