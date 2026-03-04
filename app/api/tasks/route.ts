import { requireAuth } from "@/lib/auth/guards";
import { withErrorHandling, ok, fail } from "@/lib/http/response";
import { taskSchema } from "@/lib/validation/task";

export async function GET() {
  return withErrorHandling(async () => {
    const { supabase } = await requireAuth();
    const { data, error } = await supabase.from("tasks").select("*").order("reminder_time", { ascending: true });
    if (error) return fail(`Không tải được công việc: ${error.message}`);
    return ok({ data });
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { supabase, profile } = await requireAuth(["owner", "admin", "staff"]);
    const payload = await request.json();
    const parsed = taskSchema.safeParse(payload);
    if (!parsed.success) return fail("Dữ liệu công việc không hợp lệ", 400, parsed.error.flatten());

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        clinic_id: profile.clinic_id,
        title: parsed.data.title,
        note: parsed.data.note ?? null,
        reminder_time: parsed.data.reminderTime ?? null,
        status: parsed.data.status
      })
      .select("*")
      .single();

    if (error) return fail(`Không tạo được công việc: ${error.message}`);
    return ok({ data }, 201);
  });
}
