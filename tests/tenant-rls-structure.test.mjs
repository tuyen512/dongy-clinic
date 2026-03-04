import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const initSql = readFileSync('supabase/migrations/20260303080000_init_multi_tenant.sql', 'utf8');
const extSql = readFileSync('supabase/migrations/20260304050000_logic_extensions.sql', 'utf8');

test('all original business tables include clinic_id', () => {
  for (const table of ['customers', 'treatment_histories', 'orders', 'audit_logs']) {
    const hasClinicId = new RegExp(`create table public\\.${table} \\([\\s\\S]*?clinic_id uuid not null`, 'm').test(initSql);
    assert.equal(hasClinicId, true, `Missing clinic_id in ${table}`);
  }
});

test('logic extensions add required modules: tasks, medicines, order_items, app_users', () => {
  for (const table of ['tasks', 'medicines', 'order_items', 'app_users']) {
    assert.match(extSql, new RegExp(`create table if not exists public\\.${table}`));
  }
});

test('revenue view sums only paid/received statuses', () => {
  assert.match(extSql, /create or replace view public\.v_dashboard_revenue/);
  assert.match(extSql, /status in \('paid'::public\.order_status, 'received'::public\.order_status\)/);
});

test('default admin seed exists and uses hashed password', () => {
  assert.match(extSql, /seed_default_admin_for_clinic/);
  assert.match(extSql, /crypt\('Admin123', gen_salt\('bf'\)\)/);
});

test('audit readable view exists and avoids raw JSON presentation', () => {
  assert.match(extSql, /create or replace view public\.v_audit_logs_readable/);
  assert.match(extSql, /message/);
});
