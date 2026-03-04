import { requireAuth } from "@/lib/auth/guards";
import { withErrorHandling, ok, fail } from "@/lib/http/response";
import { medicineUpdateSchema } from "@/lib/validation/medicine";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { supabase } = await requireAuth(["owner", "admin", "staff"]);
    const payload = await request.json();
    const parsed = medicineUpdateSchema.safeParse(payload);

    if (!parsed.success) return fail("Dữ liệu cập nhật thuốc không hợp lệ", 400, parsed.error.flatten());

    const { data, error } = await supabase
      .from("medicines")
      .update({
        name: parsed.data.name,
        unit: parsed.data.unit,
        unit_price: parsed.data.unitPrice,
        stock_quantity: parsed.data.stockQuantity,
        notes: parsed.data.notes
      })
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) return fail(`Không sửa được thuốc: ${error.message}`);
    return ok({ data });
  });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { supabase } = await requireAuth(["owner", "admin"]);

    const { count } = await supabase.from("order_items").select("id", { head: true, count: "exact" }).eq("medicine_id", params.id);

    if ((count ?? 0) > 0) {
      const { error } = await supabase
        .from("medicines")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", params.id);
      if (error) return fail(`Không thể soft delete thuốc: ${error.message}`);
      return ok({ success: true, softDeleted: true, message: "Thuốc đã tồn tại trong đơn hàng, đã soft delete." });
    }

    const { error } = await supabase.from("medicines").delete().eq("id", params.id);
    if (error) return fail(`Không thể xóa thuốc: ${error.message}`);

    return ok({ success: true, softDeleted: false });
  });
}
