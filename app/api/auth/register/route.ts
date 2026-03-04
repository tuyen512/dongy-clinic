import { registerSchema, parseBody } from "@/lib/validation/auth";
import { supabaseServiceRole } from "@/lib/supabase/service-role";
import { withErrorHandling, fail } from "@/lib/http/response";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const payload = await parseBody<Record<string, unknown>>(request);
    const parsed = registerSchema.safeParse(payload);

    if (!parsed.success) return fail("Dữ liệu đăng ký không hợp lệ", 400, parsed.error.flatten());

    const { clinicName, email, password, fullName, phone, notes } = parsed.data;

    const { data: authData, error: authError } = await supabaseServiceRole.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { fullName }
    });

    if (authError || !authData.user) return fail(authError?.message ?? "Không thể tạo người dùng", 400);

    const { data: clinic, error: clinicError } = await supabaseServiceRole
      .from("clinics")
      .insert({ name: clinicName, owner_user_id: authData.user.id, phone: phone ?? null, notes: notes ?? null })
      .select("id")
      .single();

    if (clinicError || !clinic) return fail(clinicError?.message ?? "Không thể tạo phòng khám", 400);

    const { error: profileError } = await supabaseServiceRole.from("profiles").insert({
      user_id: authData.user.id,
      clinic_id: clinic.id,
      role: "owner",
      full_name: fullName,
      phone: phone ?? null,
      notes: notes ?? null
    });

    if (profileError) return fail(profileError.message, 400);

    return NextResponse.redirect(new URL("/login?registered=1", request.url), { status: 303 });
  });
}
