# Kiến trúc SaaS quản lý phòng khám Đông y

## Multi-tenant + RLS
- Tenant tách bằng `clinic_id` ở toàn bộ bảng nghiệp vụ.
- RLS dùng `current_clinic_id()` + `has_role()`.

## Bổ sung logic
1. **Doanh thu dashboard**: chỉ cộng đơn `paid` hoặc `received` (view `v_dashboard_revenue`).
2. **Tasks**: bảng `tasks` hỗ trợ tạo/sửa/xóa/hoàn thành.
3. **Medicines**: bảng `medicines` + `order_items`, hỗ trợ soft delete khi đã phát sinh đơn.
4. **Visits**: API tạo lượt khám lưu `patient_id`, `doctor_name`, `diagnosis`, `visit_date`.
5. **Users nội bộ**: bảng `app_users`, role `ADMIN/DOCTOR/STAFF`, lock account, default `Admin/Admin123` được seed khi tạo clinic.
6. **Audit logs readable**: view `v_audit_logs_readable` tạo thông điệp câu chữ, không cần đọc JSON.
7. **Order status lifecycle**: khi trạng thái sang `received` sẽ set `received_date` và `end_date` theo `treatment_days`.

## Ổn định API
- Tất cả API route đều bọc `withErrorHandling()` và trả lỗi rõ ràng.
- Validation bắt buộc với `patient_id`, `medicine_id`, `quantity` trong các luồng tạo đơn/lượt khám.
