import { requireAuth } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function UsersPage() {
  const { supabase } = await requireAuth(["owner", "admin"]);
  const { data } = await supabase
    .from("app_users")
    .select("id, username, role, is_locked")
    .order("created_at", { ascending: false });

  return (
    <DashboardShell activePath="/users" title="Quản lý người dùng" subtitle="Chỉ dành cho Quản trị viên" actions={<button className="btn-primary">+ Cấp tài khoản</button>}>
      <section className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#1d3862] text-slate-300">
              <th className="px-6 py-4">Tên đăng nhập</th>
              <th className="px-6 py-4">Phân quyền</th>
              <th className="px-6 py-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={row.id} className="border-b border-[#132c4f]">
                <td className="px-6 py-4">{row.username}</td>
                <td className="px-6 py-4">{row.role}</td>
                <td className="px-6 py-4">{row.is_locked ? "Đã khóa" : "Hoạt động"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardShell>
  );
}
