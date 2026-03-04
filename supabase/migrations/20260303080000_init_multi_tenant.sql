-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type public.app_role as enum ('owner', 'admin', 'staff');
create type public.order_status as enum ('pending', 'processing', 'completed', 'cancelled');

-- Utility trigger for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Helpers from current auth context
create or replace function public.current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id
  from public.profiles
  where user_id = auth.uid();
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where user_id = auth.uid();
$$;

create or replace function public.has_role(required_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = any(required_roles);
$$;

-- Core tenant tables
create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  phone varchar(20),
  address varchar(255),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  role public.app_role not null default 'staff',
  full_name varchar(120),
  phone varchar(20),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  full_name varchar(120) not null,
  phone varchar(20),
  birth_date date,
  gender varchar(10) check (gender in ('male', 'female', 'other')),
  address varchar(255),
  diagnosis text,
  treatment_plan text,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.treatment_histories (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  treatment_date date not null,
  symptoms text,
  prescription text,
  doctor_note text,
  next_follow_up_date date,
  handwritten_note text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  order_date date not null,
  treatment_days int not null check (treatment_days > 0 and treatment_days <= 365),
  treatment_end_date date not null,
  mid_reminder_date date not null,
  refill_reminder_date date not null,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  status public.order_status not null default 'pending',
  note_for_pharmacy text,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id bigserial primary key,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  table_name text not null,
  row_id text not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  actor_user_id uuid,
  actor_role public.app_role,
  actor_email text,
  reason text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Indexes
create index idx_profiles_clinic on public.profiles(clinic_id);
create index idx_customers_clinic on public.customers(clinic_id);
create index idx_customers_phone on public.customers(clinic_id, phone);
create index idx_orders_clinic on public.orders(clinic_id);
create index idx_orders_refill_reminder on public.orders(clinic_id, refill_reminder_date);
create index idx_treatment_histories_customer on public.treatment_histories(clinic_id, customer_id, treatment_date desc);
create index idx_audit_logs_clinic_date on public.audit_logs(clinic_id, created_at desc);

-- Update triggers
create trigger trg_clinics_updated_at before update on public.clinics for each row execute function public.set_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger trg_treatment_histories_updated_at before update on public.treatment_histories for each row execute function public.set_updated_at();
create trigger trg_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

-- Created/Updated by trigger
create or replace function public.set_actor_columns()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = auth.uid();
  end if;
  new.updated_by = auth.uid();
  if new.clinic_id is null then
    new.clinic_id = public.current_clinic_id();
  end if;
  return new;
end;
$$;

create trigger trg_customers_actor before insert or update on public.customers for each row execute function public.set_actor_columns();
create trigger trg_treatment_histories_actor before insert or update on public.treatment_histories for each row execute function public.set_actor_columns();
create trigger trg_orders_actor before insert or update on public.orders for each row execute function public.set_actor_columns();

-- Audit trigger
create or replace function public.capture_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_actor_email text;
  diff_fields text[];
begin
  select email into current_actor_email from auth.users where id = auth.uid();

  if tg_op = 'UPDATE' then
    select array(
      select key
      from jsonb_object_keys(to_jsonb(new)) as key
      where to_jsonb(new)->key is distinct from to_jsonb(old)->key
    ) into diff_fields;
  end if;

  insert into public.audit_logs (
    clinic_id,
    table_name,
    row_id,
    action,
    old_data,
    new_data,
    changed_fields,
    actor_user_id,
    actor_role,
    actor_email
  )
  values (
    coalesce((case when tg_op = 'DELETE' then old.clinic_id else new.clinic_id end), public.current_clinic_id()),
    tg_table_name,
    coalesce((case when tg_op = 'DELETE' then old.id else new.id end)::text, ''),
    lower(tg_op),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    diff_fields,
    auth.uid(),
    public.current_user_role(),
    current_actor_email
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger trg_customers_audit after insert or update or delete on public.customers for each row execute function public.capture_audit_log();
create trigger trg_treatment_histories_audit after insert or update or delete on public.treatment_histories for each row execute function public.capture_audit_log();
create trigger trg_orders_audit after insert or update or delete on public.orders for each row execute function public.capture_audit_log();

-- RLS
alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.treatment_histories enable row level security;
alter table public.orders enable row level security;
alter table public.audit_logs enable row level security;

-- Clinics: visible only to same clinic users
create policy clinics_select_own on public.clinics
for select
using (id = public.current_clinic_id());

create policy clinics_update_owner on public.clinics
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- Profiles
create policy profiles_select_own_clinic on public.profiles
for select
using (clinic_id = public.current_clinic_id());

create policy profiles_manage_by_owner_admin on public.profiles
for all
using (
  clinic_id = public.current_clinic_id()
  and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role])
)
with check (
  clinic_id = public.current_clinic_id()
  and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role])
);

-- Customers
create policy customers_select_own_clinic on public.customers
for select
using (clinic_id = public.current_clinic_id());

create policy customers_insert_staff_plus on public.customers
for insert
with check (
  clinic_id = public.current_clinic_id()
  and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role, 'staff'::public.app_role])
);

create policy customers_update_staff_plus on public.customers
for update
using (
  clinic_id = public.current_clinic_id()
  and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role, 'staff'::public.app_role])
)
with check (clinic_id = public.current_clinic_id());

create policy customers_delete_admin_plus on public.customers
for delete
using (
  clinic_id = public.current_clinic_id()
  and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role])
);

-- Treatment histories
create policy treatment_histories_crud_staff_plus on public.treatment_histories
for all
using (
  clinic_id = public.current_clinic_id()
  and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role, 'staff'::public.app_role])
)
with check (
  clinic_id = public.current_clinic_id()
  and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role, 'staff'::public.app_role])
);

-- Orders
create policy orders_select_own_clinic on public.orders
for select
using (clinic_id = public.current_clinic_id());

create policy orders_insert_staff_plus on public.orders
for insert
with check (
  clinic_id = public.current_clinic_id()
  and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role, 'staff'::public.app_role])
);

create policy orders_update_staff_plus on public.orders
for update
using (
  clinic_id = public.current_clinic_id()
  and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role, 'staff'::public.app_role])
)
with check (clinic_id = public.current_clinic_id());

create policy orders_delete_admin_plus on public.orders
for delete
using (
  clinic_id = public.current_clinic_id()
  and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role])
);

-- Audit logs read-only for owner/admin within clinic
create policy audit_logs_select_owner_admin on public.audit_logs
for select
using (
  clinic_id = public.current_clinic_id()
  and public.has_role(array['owner'::public.app_role, 'admin'::public.app_role])
);

-- No direct writes to audit_logs from app users.

-- Dashboard view: completed treatment but no return after 30 days
create or replace view public.v_customers_completed_without_return as
select
  o.clinic_id,
  o.customer_id,
  max(o.treatment_end_date) as last_treatment_end_date
from public.orders o
where o.status = 'completed'
group by o.clinic_id, o.customer_id
having max(o.treatment_end_date) <= current_date - interval '30 days'
   and not exists (
     select 1
     from public.orders o2
     where o2.customer_id = o.customer_id
       and o2.clinic_id = o.clinic_id
       and o2.order_date > max(o.treatment_end_date)
   );

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
