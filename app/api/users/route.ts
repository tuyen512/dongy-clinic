import { requireAuth } from "@/lib/auth/guards";
import { withErrorHandling, ok, fail } from "@/lib/http/response";
import { createUserSchema } from "@/lib/validation/user";
import { hashPassword } from "@/lib/services/password";

export async function GET() {
  return withErrorHandling(async () => {
    const { supabase } = await requireAuth(["owner", "admin"]);
    const { data, error } = await supabase
      .from("app_users")
      .select("id, username, role, is_locked, created_at")
      .order("created_at", { ascending: false });

    if (error) return fail(`Không tải được người dùng: ${error.message}`);
    return ok({ data });
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { supabase, profile, user } = await requireAuth(["owner", "admin"]);
    const payload = await request.json();
    const parsed = createUserSchema.safeParse(payload);
    if (!parsed.success) return fail("Dữ liệu tài khoản không hợp lệ", 400, parsed.error.flatten());

    const { data, error } = await supabase
      .from("app_users")
      .insert({
        clinic_id: profile.clinic_id,
        username: parsed.data.username,
        password_hash: hashPassword(parsed.data.password),
        role: parsed.data.role,
        created_by: user.id,
        updated_by: user.id
      })
      .select("id, username, role, is_locked, created_at")
      .single();

    if (error) return fail(`Không tạo được tài khoản: ${error.message}`);
    return ok({ data }, 201);
  });
}
