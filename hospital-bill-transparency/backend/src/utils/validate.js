const PAYMENT_TYPES = new Set(['cash', 'insurance-cashless', 'insurance-reimbursement']);
const HOSPITAL_TYPES = new Set(['private', 'government', 'trust']);
const ROOM_TYPES = new Set(['general', 'semi-private', 'private', 'icu']);

function isNonEmptyString(v, max = 200) {
  return typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
}

function validateReportInput(body) {
  const errors = [];

  if (!isNonEmptyString(body.procedure, 150)) errors.push('procedure is required');
  if (!isNonEmptyString(body.category, 60)) errors.push('category is required');
  if (!isNonEmptyString(body.hospital, 200)) errors.push('hospital is required');
  if (!isNonEmptyString(body.city, 100)) errors.push('city is required');
  if (!isNonEmptyString(body.state, 100)) errors.push('state is required');

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
    errors.push('amount must be a positive number');
  }

  if (body.hospitalType !== undefined && !HOSPITAL_TYPES.has(body.hospitalType)) {
    errors.push(`hospitalType must be one of: ${[...HOSPITAL_TYPES].join(', ')}`);
  }
  if (body.paymentType !== undefined && !PAYMENT_TYPES.has(body.paymentType)) {
    errors.push(`paymentType must be one of: ${[...PAYMENT_TYPES].join(', ')}`);
  }
  if (body.roomType !== undefined && body.roomType !== null && body.roomType !== '' && !ROOM_TYPES.has(body.roomType)) {
    errors.push(`roomType must be one of: ${[...ROOM_TYPES].join(', ')}`);
  }
  if (body.notes !== undefined && body.notes !== null && (typeof body.notes !== 'string' || body.notes.length > 500)) {
    errors.push('notes must be a string under 500 characters');
  }
  if (body.billDate !== undefined && body.billDate !== null && body.billDate !== '') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.billDate) || Number.isNaN(Date.parse(body.billDate))) {
      errors.push('billDate must be a valid YYYY-MM-DD date');
    } else if (Date.parse(body.billDate) > Date.now()) {
      errors.push('billDate cannot be in the future');
    }
  }

  return errors;
}

module.exports = { validateReportInput, PAYMENT_TYPES, HOSPITAL_TYPES, ROOM_TYPES };
