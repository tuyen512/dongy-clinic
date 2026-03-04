import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function MedicinesPage() {
  const { supabase } = await requireAuth();
  const { data } = await supabase
    .from("medicines")
    .select("id, name, unit, unit_price, stock_quantity")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  return (
    <DashboardShell activePath="/medicines" title="Kho Thuốc & Vật tư" actions={<button className="btn-primary">+ Thêm thuốc</button>}>
      <section className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#1d3862] text-slate-300">
              <th className="px-6 py-4">Tên thuốc/vật tư</th>
              <th className="px-6 py-4">Đơn vị</th>
              <th className="px-6 py-4">Đơn giá</th>
              <th className="px-6 py-4">Tồn kho</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={row.id} className="border-b border-[#132c4f]">
                <td className="px-6 py-4">{row.name}</td>
                <td className="px-6 py-4">{row.unit}</td>
                <td className="px-6 py-4">{Number(row.unit_price).toLocaleString("vi-VN")} đ</td>
                <td className="px-6 py-4">{row.stock_quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardShell>
  );
}
