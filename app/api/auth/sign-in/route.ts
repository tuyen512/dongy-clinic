import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signInSchema, parseBody } from "@/lib/validation/auth";
import { withErrorHandling, fail } from "@/lib/http/response";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const supabase = await createSupabaseServerClient();
    const payload = await parseBody<Record<string, unknown>>(request);
    const parsed = signInSchema.safeParse(payload);

    if (!parsed.success) return fail("Thông tin đăng nhập không hợp lệ", 400, parsed.error.flatten());

    const { email, password } = parsed.data;
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return fail(`Đăng nhập thất bại: ${error.message}`, 401);

    return NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
  });
}
