import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function TasksPage() {
  const { supabase } = await requireAuth();
  const today = new Date().toISOString().slice(0, 10);
  const inSevenDays = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);

  const [{ data: refill }, { data: pendingDelivery }, { data: manualTasks }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, refill_reminder_date, customers(full_name)")
      .gte("refill_reminder_date", today)
      .lte("refill_reminder_date", inSevenDays),
    supabase.from("orders").select("id, status, customers(full_name)").eq("status", "shipping"),
    supabase.from("tasks").select("id, title, reminder_time, status").order("reminder_time", { ascending: true }).limit(10)
  ]);

  return (
    <DashboardShell activePath="/tasks" title="Công việc hôm nay" subtitle="Quản lý lời nhắc và lịch hẹn trong ngày" actions={<button className="btn-primary">+ Thêm nhắc việc</button>}>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="panel p-6">
          <h3 className="text-2xl font-bold text-amber-300">Khách sắp hết thuốc (7 ngày tới)</h3>
          <ul className="mt-6 space-y-2 text-slate-300">
            {(refill ?? []).length === 0 ? <li>Không có khách hàng nào sắp hết thuốc.</li> : null}
            {(refill ?? []).map((row) => (
              <li key={row.id}>{row.customers?.full_name ?? "Khách"} - {row.refill_reminder_date}</li>
            ))}
          </ul>
        </section>
        <section className="panel p-6">
          <h3 className="text-2xl font-bold text-cyan-300">Lịch hẹn & Nhắc việc thủ công</h3>
          <p className="mt-6 text-slate-400">Bạn có thể ghi chú tay vào các trường notes trong bảng orders/customers.</p>
        </section>
      </div>
      <section className="panel p-6">
        <h3 className="text-2xl font-bold text-sky-300">Danh sách công việc</h3>
        <ul className="mt-4 space-y-2 text-slate-300">
          {(manualTasks ?? []).map((task) => (
            <li key={task.id}>{task.title} - {task.status}{task.reminder_time ? ` (${task.reminder_time})` : ""}</li>
          ))}
        </ul>
      </section>
      <section className="panel p-6">
        <h3 className="text-2xl font-bold text-violet-300">Đơn hàng đang giao (Chưa nhận)</h3>
        <ul className="mt-6 space-y-2 text-slate-300">
          {(pendingDelivery ?? []).length === 0 ? <li>Không có đơn hàng nào đang giao.</li> : null}
          {(pendingDelivery ?? []).map((row) => (
            <li key={row.id}>{row.customers?.full_name ?? "Khách"} - {row.status}</li>
          ))}
        </ul>
      </section>
    </DashboardShell>
  );
}
