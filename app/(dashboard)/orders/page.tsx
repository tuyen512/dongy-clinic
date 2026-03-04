import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function OrdersPage() {
  const { supabase } = await requireAuth();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_date, total_amount, status, customers(full_name)")
    .order("order_date", { ascending: false })
    .limit(30);

  return (
    <DashboardShell activePath="/orders" title="Đơn thuốc & Thanh toán" actions={<button className="btn-primary">+ Tạo đơn mới</button>}>
      <section className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#1d3862] text-slate-300">
              <th className="px-6 py-4">Mã đơn</th>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4">Tổng tiền</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((row) => (
              <tr key={row.id} className="border-b border-[#132c4f]">
                <td className="px-6 py-4 font-medium">{row.id.slice(0, 8)}</td>
                <td className="px-6 py-4">{row.customers?.full_name ?? "-"}</td>
                <td className="px-6 py-4">{Number(row.total_amount).toLocaleString("vi-VN")} đ</td>
                <td className="px-6 py-4">{row.status}</td>
                <td className="px-6 py-4">{row.order_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardShell>
  );
}
