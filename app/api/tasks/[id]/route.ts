import { requireAuth } from "@/lib/auth/guards";
import { withErrorHandling, ok, fail } from "@/lib/http/response";
import { taskUpdateSchema } from "@/lib/validation/task";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { supabase } = await requireAuth(["owner", "admin", "staff"]);
    const payload = await request.json();
    const parsed = taskUpdateSchema.safeParse(payload);
    if (!parsed.success) return fail("Dữ liệu cập nhật công việc không hợp lệ", 400, parsed.error.flatten());

    const { data, error } = await supabase
      .from("tasks")
      .update({
        title: parsed.data.title,
        note: parsed.data.note,
        reminder_time: parsed.data.reminderTime,
        status: parsed.data.status
      })
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) return fail(`Không cập nhật được công việc: ${error.message}`);
    return ok({ data });
  });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { supabase } = await requireAuth(["owner", "admin", "staff"]);
    const { error } = await supabase.from("tasks").delete().eq("id", params.id);
    if (error) return fail(`Không xóa được công việc: ${error.message}`);
    return ok({ success: true });
  });
}
