import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function AuditLogsPage() {
  const { supabase } = await requireAuth(["owner", "admin"]);
  const { data } = await supabase
    .from("v_audit_logs_readable")
    .select("id, created_at, message")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <DashboardShell activePath="/audit-logs" title="Lịch sử hệ thống">
      <section className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#1d3862] text-slate-300">
              <th className="px-6 py-4">Thời gian</th>
              <th className="px-6 py-4">Nội dung thao tác</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={row.id} className="border-b border-[#132c4f]">
                <td className="px-6 py-4">{new Date(row.created_at).toLocaleString("vi-VN")}</td>
                <td className="px-6 py-4">{row.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardShell>
  );
}
