import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function CustomersPage() {
  const { supabase } = await requireAuth();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name, phone, gender, notes")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <DashboardShell
      activePath="/customers"
      title="Danh sách Khách hàng"
      subtitle="Quản lý hồ sơ bệnh nhân"
      actions={<button className="btn-primary">+ Thêm khách hàng</button>}
    >
      <section className="panel overflow-hidden">
        <div className="border-b border-[#1d3862] p-4">
          <input className="input-dark max-w-md" placeholder="Tìm kiếm theo tên hoặc SĐT..." />
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-300">
            <tr className="border-b border-[#1d3862]">
              <th className="px-6 py-4">Họ và tên</th>
              <th className="px-6 py-4">Số điện thoại</th>
              <th className="px-6 py-4">Giới tính</th>
              <th className="px-6 py-4">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map((row) => (
              <tr key={row.id} className="border-b border-[#132c4f]">
                <td className="px-6 py-4 font-semibold">{row.full_name}</td>
                <td className="px-6 py-4">{row.phone ?? "-"}</td>
                <td className="px-6 py-4">{row.gender ?? "-"}</td>
                <td className="px-6 py-4 text-slate-400">{row.notes ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardShell>
  );
}
