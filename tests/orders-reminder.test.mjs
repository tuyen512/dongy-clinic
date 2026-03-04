import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateReminderDates, __internal } from '../lib/services/orders-logic.mjs';

test('calculate reminder dates for long treatment > 10 days', () => {
  const result = calculateReminderDates('2026-03-01', 30);
  assert.deepEqual(result, {
    treatmentEndDate: '2026-03-31',
    midReminderDate: '2026-03-16',
    refillReminderDate: '2026-03-21'
  });
});

test('calculate reminder dates for short treatment <= 10 days uses 7-day lead', () => {
  const result = calculateReminderDates('2026-03-01', 8);
  assert.equal(result.treatmentEndDate, '2026-03-09');
  assert.equal(result.midReminderDate, '2026-03-05');
  assert.equal(result.refillReminderDate, '2026-03-02');
});

test('date helper addDays is stable in UTC', () => {
  assert.equal(__internal.addDays('2026-03-31', 1), '2026-04-01');
  assert.equal(__internal.addDays('2026-03-01', -1), '2026-02-28');
});
