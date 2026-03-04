import { requireAuth } from "@/lib/auth/guards";
import { withErrorHandling, ok, fail } from "@/lib/http/response";
import { updateUserSchema } from "@/lib/validation/user";
import { hashPassword } from "@/lib/services/password";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { supabase, user } = await requireAuth(["owner", "admin"]);
    const payload = await request.json();
    const parsed = updateUserSchema.safeParse(payload);
    if (!parsed.success) return fail("Dữ liệu cập nhật tài khoản không hợp lệ", 400, parsed.error.flatten());

    const updates: Record<string, unknown> = { updated_by: user.id };
    if (parsed.data.role) updates.role = parsed.data.role;
    if (typeof parsed.data.isLocked === "boolean") updates.is_locked = parsed.data.isLocked;
    if (parsed.data.password) updates.password_hash = hashPassword(parsed.data.password);

    const { data, error } = await supabase
      .from("app_users")
      .update(updates)
      .eq("id", params.id)
      .select("id, username, role, is_locked, created_at")
      .single();

    if (error) return fail(`Không sửa được tài khoản: ${error.message}`);
    return ok({ data });
  });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { supabase } = await requireAuth(["owner", "admin"]);
    const { error } = await supabase.from("app_users").delete().eq("id", params.id);
    if (error) return fail(`Không xóa được tài khoản: ${error.message}`);
    return ok({ success: true });
  });
}
