import { requireAuth } from "@/lib/auth/guards";
import { withErrorHandling, ok, fail } from "@/lib/http/response";
import { createVisitSchema } from "@/lib/validation/visit";

export async function GET() {
  return withErrorHandling(async () => {
    const { supabase } = await requireAuth();
    const { data, error } = await supabase
      .from("treatment_histories")
      .select("id, customer_id, doctor_name, diagnosis, visit_date, handwritten_note, customers(full_name)")
      .order("visit_date", { ascending: false })
      .limit(100);

    if (error) return fail(`Không tải được lượt khám: ${error.message}`);
    return ok({ data });
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { supabase, profile } = await requireAuth(["owner", "admin", "staff"]);
    const payload = await request.json();
    const parsed = createVisitSchema.safeParse(payload);

    if (!parsed.success) return fail("Dữ liệu lượt khám không hợp lệ", 400, parsed.error.flatten());

    const { patient_id, doctor_name, diagnosis, visit_date, note } = parsed.data;
    if (!patient_id) return fail("patient_id là bắt buộc", 400);

    const { data, error } = await supabase
      .from("treatment_histories")
      .insert({
        clinic_id: profile.clinic_id,
        customer_id: patient_id,
        doctor_name,
        diagnosis,
        visit_date,
        treatment_date: visit_date,
        doctor_note: diagnosis,
        handwritten_note: note ?? null
      })
      .select("id, customer_id, doctor_name, diagnosis, visit_date, customers(full_name)")
      .single();

    if (error) return fail(`Không tạo được lượt khám: ${error.message}`);
    return ok({ data }, 201);
  });
}
