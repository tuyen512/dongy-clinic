import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "Bảng điều khiển" },
  { href: "/customers", label: "Khách hàng" },
  { href: "/visits", label: "Lượt khám" },
  { href: "/orders", label: "Đơn hàng" },
  { href: "/tasks", label: "Công việc hôm nay" },
  { href: "/medicines", label: "Thuốc & Vật tư" },
  { href: "/audit-logs", label: "Lịch sử hệ thống" },
  { href: "/users", label: "Quản lý người dùng" }
];

export function Sidebar({ activePath }: { activePath: string }) {
  return (
    <aside className="hidden w-72 border-r border-[#1a345d] bg-[#091938] px-5 py-6 lg:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/90 text-lg">∿</div>
        <div>
          <p className="text-3 font-bold">MediCore</p>
          <p className="text-xs text-slate-400">Clinic System</p>
        </div>
      </div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Menu chính</p>
      <nav className="space-y-2">
        {nav.map((item) => {
          const active = activePath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-4 py-2.5 text-sm transition ${
                active ? "bg-[#0b325a] text-sky-300" : "text-slate-300 hover:bg-[#0f2a4c]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
