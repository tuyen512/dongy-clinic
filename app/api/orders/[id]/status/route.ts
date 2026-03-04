import { requireAuth } from "@/lib/auth/guards";
import { withErrorHandling, ok, fail } from "@/lib/http/response";
import { updateOrderStatusSchema } from "@/lib/validation/order";
import { supabaseServiceRole } from "@/lib/supabase/service-role";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { supabase, profile, user } = await requireAuth(["owner", "admin", "staff"]);
    const payload = await request.json();
    const parsed = updateOrderStatusSchema.safeParse(payload);

    if (!parsed.success) return fail("Trạng thái đơn hàng không hợp lệ", 400, parsed.error.flatten());

    const { status, received_date } = parsed.data;

    const { data: currentOrder, error: currentError } = await supabase
      .from("orders")
      .select("id, status, treatment_days")
      .eq("id", params.id)
      .single();

    if (currentError || !currentOrder) return fail("Không tìm thấy đơn hàng", 404);

    const updates: Record<string, unknown> = { status };
    if (status === "received") {
      const receivedDate = received_date ?? new Date().toISOString().slice(0, 10);
      const endDateObj = new Date(`${receivedDate}T00:00:00.000Z`);
      endDateObj.setUTCDate(endDateObj.getUTCDate() + Number(currentOrder.treatment_days ?? 0));
      updates.received_date = receivedDate;
      updates.end_date = endDateObj.toISOString().slice(0, 10);
    }

    if (status === "paid") {
      const { data: totalOrder } = await supabase.from("orders").select("total_amount").eq("id", params.id).single();
      updates.paid_amount = Number(totalOrder?.total_amount ?? 0);
    }

    const { data, error } = await supabase.from("orders").update(updates).eq("id", params.id).select("*").single();
    if (error) return fail(`Không cập nhật được trạng thái đơn: ${error.message}`);

    await supabaseServiceRole.from("audit_logs").insert({
      clinic_id: profile.clinic_id,
      table_name: "orders",
      row_id: params.id,
      action: "update",
      actor_user_id: user.id,
      actor_email: user.email ?? null,
      actor_name: user.email ?? "user",
      action_label: "cập nhật trạng thái",
      target_label: `Đơn hàng #${params.id}`,
      old_value_text: String(currentOrder.status),
      new_value_text: String(status)
    });

    return ok({ data });
  });
}
