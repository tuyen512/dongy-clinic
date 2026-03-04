# Dongy Clinic SaaS (Next.js + Supabase)

Ứng dụng SaaS quản lý phòng khám Đông y theo mô hình multi-tenant, giao diện MediCore giữ nguyên.

## Cập nhật logic mới
- Dashboard doanh thu chỉ tính đơn `paid` hoặc `received`.
- Công việc hôm nay: hỗ trợ CRUD + hoàn thành (`tasks`).
- Kho thuốc/vật tư: hỗ trợ sửa/xóa; nếu đã dùng trong đơn thì soft delete.
- Lượt khám: API tạo mới với `patient_id`, `doctor_name`, `diagnosis`, `visit_date`.
- Quản lý người dùng nội bộ (`app_users`) với role `ADMIN/DOCTOR/STAFF`, khóa tài khoản, đổi role.
- Lịch sử hệ thống dạng câu chữ qua `v_audit_logs_readable`.
- Cập nhật trạng thái đơn hàng có logic `received_date` và `end_date`.

## API chính
- `GET/POST /api/orders`
- `PATCH /api/orders/:id/status`
- `GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/:id`
- `GET/POST /api/medicines`, `PATCH/DELETE /api/medicines/:id`
- `GET/POST /api/visits`
- `GET/POST /api/users`, `PATCH/DELETE /api/users/:id`
- `GET /api/audit-logs`

## Migration mới
- `supabase/migrations/20260304050000_logic_extensions.sql`

## Chạy kiểm tra logic
```bash
npm run test:logic
```
