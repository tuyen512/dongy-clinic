import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardPage() {
  const { supabase } = await requireAuth();

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const inTenDays = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString().slice(0, 10);

  const [{ count: pendingOrders }, { count: refillSoon }, { count: churnRisk }, { data: revenueData }] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "processing"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("refill_reminder_date", today).lte("refill_reminder_date", inTenDays),
    supabase.from("v_customers_completed_without_return").select("customer_id", { count: "exact", head: true }),
    supabase.from("orders").select("total_amount, paid_amount, status").in("status", ["paid", "received"])
  ]);

  const revenue = (revenueData ?? []).reduce((sum, row) => sum + Number(row.paid_amount ?? row.total_amount ?? 0), 0);

  return (
    <DashboardShell activePath="/dashboard" title="Tổng quan" subtitle="Theo dõi hoạt động phòng khám của bạn.">
      <div className="grid gap-4 lg:grid-cols-4">
        {[`Doanh thu: ${revenue.toLocaleString("vi-VN")} đ`, `Đơn chờ xử lý: ${pendingOrders ?? 0}`, `Khách sắp hết thuốc: ${refillSoon ?? 0}`, `Chưa quay lại: ${churnRisk ?? 0}`].map((kpi) => (
          <article key={kpi} className="panel p-6 text-lg font-semibold">
            {kpi}
          </article>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <section className="panel min-h-[340px] p-6 xl:col-span-2">
          <h3 className="text-3xl font-bold">Biểu đồ doanh thu</h3>
          <p className="mt-4 text-sm text-slate-400">Khuyến nghị: render chart thật bằng dữ liệu Supabase trong Sprint 2.</p>
        </section>
        <section className="panel min-h-[340px] p-6">
          <h3 className="text-3xl font-bold">Lịch khám hôm nay</h3>
          <p className="mt-20 text-center text-slate-400">Chưa có lịch hẹn nào.</p>
        </section>
      </div>
    </DashboardShell>
  );
}
