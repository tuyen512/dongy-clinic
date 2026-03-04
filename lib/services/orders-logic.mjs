const REFILL_REMINDER_MIN_DAYS = 7;
const REFILL_REMINDER_MAX_DAYS = 10;

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateOnly(date);
}

export function calculateReminderDates(orderDate, treatmentDays) {
  const treatmentEndDate = addDays(orderDate, treatmentDays);
  const midReminderDate = addDays(orderDate, Math.floor(treatmentDays / 2));
  const refillLeadDays = treatmentDays > REFILL_REMINDER_MAX_DAYS ? REFILL_REMINDER_MAX_DAYS : REFILL_REMINDER_MIN_DAYS;
  const refillReminderDate = addDays(treatmentEndDate, -refillLeadDays);

  return {
    treatmentEndDate,
    midReminderDate,
    refillReminderDate
  };
}

export const __internal = { addDays };
