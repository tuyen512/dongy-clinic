import { requireAuth } from "@/lib/auth/guards";
import { withErrorHandling, ok, fail } from "@/lib/http/response";
import { orderSchema } from "@/lib/validation/order";
import { calculateReminderDates } from "@/lib/services/orders";

export async function GET() {
  return withErrorHandling(async () => {
    const { supabase } = await requireAuth();
    const { data, error } = await supabase
      .from("orders")
      .select("*, customers(full_name, phone), order_items(id, medicine_id, quantity, unit_price, medicines(name, unit))")
      .order("order_date", { ascending: false })
      .limit(100);

    if (error) return fail(`Không tải được đơn hàng: ${error.message}`);
    return ok({ data });
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { supabase, profile } = await requireAuth(["owner", "admin", "staff"]);
    const payload = await request.json();
    const parsed = orderSchema.safeParse(payload);

    if (!parsed.success) return fail("Dữ liệu đơn hàng không hợp lệ", 400, parsed.error.flatten());

    const { patient_id, order_date, treatment_days, status, notes, items } = parsed.data;

    const medicineIds = items.map((item) => item.medicine_id);
    const { data: medicines, error: medError } = await supabase
      .from("medicines")
      .select("id, unit_price, is_deleted")
      .in("id", medicineIds);

    if (medError) return fail(`Không tải được thuốc: ${medError.message}`);
    if (!medicines || medicines.length !== medicineIds.length) return fail("medicine_id không hợp lệ hoặc không tồn tại", 400);

    const medMap = new Map(medicines.map((m) => [m.id, m]));
    for (const item of items) {
      if (!item.medicine_id || !item.quantity) return fail("medicine_id và quantity là bắt buộc", 400);
      if (medMap.get(item.medicine_id)?.is_deleted) return fail("Không thể tạo đơn với thuốc đã bị xóa", 400);
    }

    const totalAmount = items.reduce((sum, item) => sum + Number(medMap.get(item.medicine_id)?.unit_price ?? 0) * item.quantity, 0);
    const reminder = calculateReminderDates(order_date, treatment_days);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        clinic_id: profile.clinic_id,
        customer_id: patient_id,
        order_date,
        treatment_days,
        treatment_end_date: reminder.treatmentEndDate,
        mid_reminder_date: reminder.midReminderDate,
        refill_reminder_date: reminder.refillReminderDate,
        total_amount: totalAmount,
        paid_amount: status === "paid" || status === "received" ? totalAmount : 0,
        status,
        notes: notes ?? null
      })
      .select("*")
      .single();

    if (orderError || !order) return fail(`Không tạo được đơn hàng: ${orderError?.message ?? "Unknown"}`);

    const orderItems = items.map((item) => ({
      clinic_id: profile.clinic_id,
      order_id: order.id,
      medicine_id: item.medicine_id,
      quantity: item.quantity,
      unit_price: Number(medMap.get(item.medicine_id)?.unit_price ?? 0)
    }));

    const { error: itemError } = await supabase.from("order_items").insert(orderItems);
    if (itemError) return fail(`Đơn đã tạo nhưng không lưu được danh sách thuốc: ${itemError.message}`, 400);

    return ok({ data: order }, 201);
  });
}
