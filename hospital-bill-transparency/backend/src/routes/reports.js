const express = require('express');
const db = require('../services/db');
const { validateReportInput } = require('../utils/validate');
const logger = require('../utils/logger');

const router = express.Router();

const MAX_PAGE_SIZE = 50;

// POST /api/reports - submit a new anonymous bill report
router.post('/', (req, res) => {
  const errors = validateReportInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Invalid submission', details: errors });
  }

  const {
    procedure, category, hospital, city, state, amount,
    hospitalType = 'private', paymentType = 'cash', roomType = null, notes = null, billDate = null,
  } = req.body;

  const stmt = db.prepare(`
    INSERT INTO reports (procedure, category, hospital, hospital_type, city, state, amount, payment_type, room_type, notes, bill_date)
    VALUES (@procedure, @category, @hospital, @hospitalType, @city, @state, @amount, @paymentType, @roomType, @notes, @billDate)
  `);

  const result = stmt.run({
    procedure: procedure.trim(),
    category: category.trim(),
    hospital: hospital.trim(),
    hospitalType,
    city: city.trim(),
    state: state.trim(),
    amount: Number(amount),
    paymentType,
    roomType: roomType || null,
    notes: notes ? notes.trim().slice(0, 500) : null,
    billDate: billDate || null,
  });

  logger.info(`New report submitted: id=${result.lastInsertRowid}`);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Report submitted anonymously. Thank you.' });
});

// GET /api/reports - browse/filter reports (paginated)
router.get('/', (req, res) => {
  const { procedure, hospital, city, state, category, paymentType, hospitalType, q } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const clauses = [];
  const params = {};

  if (procedure) { clauses.push('procedure = @procedure'); params.procedure = procedure; }
  if (hospital) { clauses.push('hospital = @hospital'); params.hospital = hospital; }
  if (city) { clauses.push('city = @city'); params.city = city; }
  if (state) { clauses.push('state = @state'); params.state = state; }
  if (category) { clauses.push('category = @category'); params.category = category; }
  if (paymentType) { clauses.push('payment_type = @paymentType'); params.paymentType = paymentType; }
  if (hospitalType) { clauses.push('hospital_type = @hospitalType'); params.hospitalType = hospitalType; }
  if (q) {
    clauses.push('(procedure LIKE @q OR hospital LIKE @q OR city LIKE @q)');
    params.q = `%${q}%`;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) AS count FROM reports ${where}`).get(params).count;
  const rows = db
    .prepare(`SELECT * FROM reports ${where} ORDER BY created_at DESC, id DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset });

  res.json({
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

module.exports = router;
