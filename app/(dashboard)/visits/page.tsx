import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function VisitsPage() {
  const { supabase } = await requireAuth();
  const { data: visits } = await supabase
    .from("treatment_histories")
    .select("id, visit_date, doctor_name, diagnosis, customers(full_name)")
    .order("visit_date", { ascending: false })
    .limit(20);

  return (
    <DashboardShell activePath="/visits" title="Hồ sơ Lượt khám" actions={<button className="btn-primary">+ Khám mới</button>}>
      <section className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#1d3862] text-slate-300">
              <th className="px-6 py-4">Bệnh nhân</th>
              <th className="px-6 py-4">Bác sĩ phụ trách</th>
              <th className="px-6 py-4">Chẩn đoán</th>
              <th className="px-6 py-4">Ngày khám</th>
            </tr>
          </thead>
          <tbody>
            {(visits ?? []).map((row) => (
              <tr key={row.id} className="border-b border-[#132c4f]">
                <td className="px-6 py-4 font-semibold">{row.customers?.full_name ?? "-"}</td>
                <td className="px-6 py-4">{row.doctor_name ?? "Bs. phòng khám"}</td>
                <td className="px-6 py-4">{row.diagnosis ?? "-"}</td>
                <td className="px-6 py-4">{row.visit_date ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardShell>
  );
}
