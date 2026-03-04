import { requireAuth } from "@/lib/auth/guards";
import { withErrorHandling, ok, fail } from "@/lib/http/response";
import { medicineSchema } from "@/lib/validation/medicine";

export async function GET() {
  return withErrorHandling(async () => {
    const { supabase } = await requireAuth();
    const { data, error } = await supabase
      .from("medicines")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) return fail(`Không tải được thuốc: ${error.message}`);
    return ok({ data });
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { supabase, profile } = await requireAuth(["owner", "admin", "staff"]);
    const payload = await request.json();
    const parsed = medicineSchema.safeParse(payload);
    if (!parsed.success) return fail("Dữ liệu thuốc không hợp lệ", 400, parsed.error.flatten());

    const { data, error } = await supabase
      .from("medicines")
      .insert({
        clinic_id: profile.clinic_id,
        name: parsed.data.name,
        unit: parsed.data.unit,
        unit_price: parsed.data.unitPrice,
        stock_quantity: parsed.data.stockQuantity,
        notes: parsed.data.notes ?? null
      })
      .select("*")
      .single();

    if (error) return fail(`Không tạo được thuốc: ${error.message}`);
    return ok({ data }, 201);
  });
}
