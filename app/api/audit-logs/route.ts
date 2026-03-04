import { requireAuth } from "@/lib/auth/guards";
import { withErrorHandling, ok, fail } from "@/lib/http/response";

export async function GET() {
  return withErrorHandling(async () => {
    const { supabase } = await requireAuth(["owner", "admin"]);
    const { data, error } = await supabase
      .from("v_audit_logs_readable")
      .select("id, actor, action, target, old_value, new_value, created_at, message")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return fail(`Không tải được lịch sử hệ thống: ${error.message}`);
    return ok({ data });
  });
}
