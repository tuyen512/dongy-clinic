create extension if not exists "pgcrypto";

-- Extend enum for operational statuses
alter type public.order_status add value if not exists 'shipping';
alter type public.order_status add value if not exists 'paid';
alter type public.order_status add value if not exists 'received';

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  title varchar(160) not null,
  note text,
  reminder_time timestamptz,
  status varchar(20) not null default 'pending' check (status in ('pending', 'completed')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Medicine / inventory
create table if not exists public.medicines (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name varchar(160) not null,
  unit varchar(40) not null,
  unit_price numeric(12,2) not null default 0,
  stock_quantity int not null default 0,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  medicine_id uuid not null references public.medicines(id) on delete restrict,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default timezone('utc', now())
);

-- Extend orders for receiving lifecycle
alter table public.orders add column if not exists received_date date;
alter table public.orders add column if not exists end_date date;

-- User management table (default admin + role lock)
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  username varchar(80) not null,
  password_hash text not null,
  role varchar(20) not null check (role in ('ADMIN', 'DOCTOR', 'STAFF')),
  is_locked boolean not null default false,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (clinic_id, username)
);

-- Audit columns for readable logs
alter table public.audit_logs add column if not exists actor_name text;
alter table public.audit_logs add column if not exists action_label text;
alter table public.audit_logs add column if not exists target_label text;
alter table public.audit_logs add column if not exists old_value_text text;
alter table public.audit_logs add column if not exists new_value_text text;

create index if not exists idx_tasks_clinic_reminder on public.tasks(clinic_id, reminder_time);
create index if not exists idx_medicines_clinic_deleted on public.medicines(clinic_id, is_deleted);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_app_users_clinic on public.app_users(clinic_id);

create trigger trg_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger trg_medicines_updated_at before update on public.medicines for each row execute function public.set_updated_at();
create trigger trg_app_users_updated_at before update on public.app_users for each row execute function public.set_updated_at();

create trigger trg_tasks_actor before insert or update on public.tasks for each row execute function public.set_actor_columns();
create trigger trg_medicines_actor before insert or update on public.medicines for each row execute function public.set_actor_columns();
create trigger trg_app_users_actor before insert or update on public.app_users for each row execute function public.set_actor_columns();
create trigger trg_order_items_actor before insert on public.order_items for each row execute function public.set_actor_columns();

-- Override audit capture to include readable fields.
create or replace function public.capture_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_actor_email text;
  current_actor_name text;
  diff_fields text[];
  old_row jsonb;
  new_row jsonb;
begin
  select email into current_actor_email from auth.users where id = auth.uid();
  select coalesce(full_name, current_actor_email) into current_actor_name from public.profiles where user_id = auth.uid();

  if tg_op = 'UPDATE' then
    select array(
      select key
      from jsonb_object_keys(to_jsonb(new)) as key
      where to_jsonb(new)->key is distinct from to_jsonb(old)->key
    ) into diff_fields;
  end if;

  old_row := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  new_row := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;

  insert into public.audit_logs (
    clinic_id, table_name, row_id, action, old_data, new_data, changed_fields,
    actor_user_id, actor_role, actor_email, actor_name, action_label, target_label, old_value_text, new_value_text
  )
  values (
    coalesce((case when tg_op = 'DELETE' then old.clinic_id else new.clinic_id end), public.current_clinic_id()),
    tg_table_name,
    coalesce((case when tg_op = 'DELETE' then old.id else new.id end)::text, ''),
    lower(tg_op),
    old_row,
    new_row,
    diff_fields,
    auth.uid(),
    public.current_user_role(),
    current_actor_email,
    current_actor_name,
    lower(tg_op),
    tg_table_name || ' #' || coalesce((case when tg_op = 'DELETE' then old.id else new.id end)::text, ''),
    case when tg_op in ('UPDATE', 'DELETE') then old_row::text else null end,
    case when tg_op in ('INSERT', 'UPDATE') then new_row::text else null end
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

-- New table audit triggers
create trigger trg_tasks_audit after insert or update or delete on public.tasks for each row execute function public.capture_audit_log();
create trigger trg_medicines_audit after insert or update or delete on public.medicines for each row execute function public.capture_audit_log();
create trigger trg_order_items_audit after insert or update or delete on public.order_items for each row execute function public.capture_audit_log();
create trigger trg_app_users_audit after insert or update or delete on public.app_users for each row execute function public.capture_audit_log();

-- Revenue view
create or replace view public.v_dashboard_revenue as
select clinic_id, coalesce(sum(total_amount), 0) as revenue
from public.orders
where status in ('paid'::public.order_status, 'received'::public.order_status)
group by clinic_id;

-- Readable audit view
create or replace view public.v_audit_logs_readable as
select
  id,
  clinic_id,
  coalesce(actor_name, actor_email, 'system') as actor,
  coalesce(action_label, action) as action,
  coalesce(target_label, table_name || ' #' || row_id) as target,
  old_value_text as old_value,
  new_value_text as new_value,
  created_at,
  case
    when old_value_text is not null and new_value_text is not null
      then coalesce(actor_name, actor_email, 'system') || ' đã cập nhật ' || coalesce(target_label, table_name || ' #' || row_id) || ' từ "' || old_value_text || '" thành "' || new_value_text || '".'
    else coalesce(actor_name, actor_email, 'system') || ' đã ' || coalesce(action_label, action) || ' ' || coalesce(target_label, table_name || ' #' || row_id) || '.'
  end as message
from public.audit_logs;

-- Default ADMIN user for each clinic
create or replace function public.seed_default_admin_for_clinic()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (clinic_id, username, password_hash, role)
  values (new.id, 'Admin', crypt('Admin123', gen_salt('bf')), 'ADMIN')
  on conflict (clinic_id, username) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_seed_default_admin on public.clinics;
create trigger trg_seed_default_admin
after insert on public.clinics
for each row execute function public.seed_default_admin_for_clinic();

-- RLS for new tables
alter table public.tasks enable row level security;
alter table public.medicines enable row level security;
alter table public.order_items enable row level security;
alter table public.app_users enable row level security;

create policy tasks_crud_staff_plus on public.tasks
for all
using (clinic_id = public.current_clinic_id() and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role, 'staff'::public.app_role]))
with check (clinic_id = public.current_clinic_id() and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role, 'staff'::public.app_role]));

create policy medicines_select_staff_plus on public.medicines
for select
using (clinic_id = public.current_clinic_id());

create policy medicines_insert_update_staff_plus on public.medicines
for all
using (clinic_id = public.current_clinic_id() and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role, 'staff'::public.app_role]))
with check (clinic_id = public.current_clinic_id() and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role, 'staff'::public.app_role]));

create policy order_items_crud_staff_plus on public.order_items
for all
using (clinic_id = public.current_clinic_id() and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role, 'staff'::public.app_role]))
with check (clinic_id = public.current_clinic_id() and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role, 'staff'::public.app_role]));

create policy app_users_admin_only on public.app_users
for all
using (clinic_id = public.current_clinic_id() and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role]))
with check (clinic_id = public.current_clinic_id() and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role]));

alter table public.treatment_histories add column if not exists doctor_name varchar(120);
alter table public.treatment_histories add column if not exists diagnosis text;
alter table public.treatment_histories add column if not exists visit_date date;
