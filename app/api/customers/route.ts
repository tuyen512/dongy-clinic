import { requireAuth } from "@/lib/auth/guards";
import { customerSchema } from "@/lib/validation/customer";
import { withErrorHandling, ok, fail } from "@/lib/http/response";

export async function GET() {
  return withErrorHandling(async () => {
    const { supabase } = await requireAuth();

    const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) return fail(`Không tải được khách hàng: ${error.message}`);

    return ok({ data });
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { supabase, profile } = await requireAuth(["owner", "admin", "staff"]);
    const payload = await request.json();
    const parsed = customerSchema.safeParse(payload);

    if (!parsed.success) return fail("Dữ liệu khách hàng không hợp lệ", 400, parsed.error.flatten());

    const { data, error } = await supabase
      .from("customers")
      .insert({
        clinic_id: profile.clinic_id,
        full_name: parsed.data.fullName,
        phone: parsed.data.phone ?? null,
        birth_date: parsed.data.birthDate ?? null,
        gender: parsed.data.gender ?? null,
        address: parsed.data.address ?? null,
        diagnosis: parsed.data.diagnosis ?? null,
        treatment_plan: parsed.data.treatmentPlan ?? null,
        notes: parsed.data.notes ?? null
      })
      .select("*")
      .single();

    if (error) return fail(`Không tạo được khách hàng: ${error.message}`);

    return ok({ data }, 201);
  });
}
