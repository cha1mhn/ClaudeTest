const express = require('express');
const db = require('../services/db');

const router = express.Router();

// GET /api/procedures - list distinct procedures with report counts & price range
router.get('/', (req, res) => {
  const { q, category } = req.query;
  const clauses = [];
  const params = {};

  if (q) { clauses.push('procedure LIKE @q'); params.q = `%${q}%`; }
  if (category) { clauses.push('category = @category'); params.category = category; }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const rows = db.prepare(`
    SELECT
      procedure,
      category,
      COUNT(*) AS reportCount,
      COUNT(DISTINCT hospital) AS hospitalCount,
      MIN(amount) AS minAmount,
      MAX(amount) AS maxAmount,
      ROUND(AVG(amount)) AS avgAmount
    FROM reports
    ${where}
    GROUP BY procedure, category
    ORDER BY reportCount DESC
  `).all(params);

  const withSpread = rows.map((r) => ({
    ...r,
    priceGapRatio: r.minAmount > 0 ? Number((r.maxAmount / r.minAmount).toFixed(2)) : null,
  }));

  res.json({ data: withSpread });
});

// GET /api/procedures/:procedure/compare - per-hospital breakdown for one procedure
router.get('/:procedure/compare', (req, res) => {
  const { procedure } = req.params;
  const { city, state } = req.query;

  const clauses = ['procedure = @procedure'];
  const params = { procedure };
  if (city) { clauses.push('city = @city'); params.city = city; }
  if (state) { clauses.push('state = @state'); params.state = state; }
  const where = `WHERE ${clauses.join(' AND ')}`;

  const byHospital = db.prepare(`
    SELECT
      hospital,
      hospital_type AS hospitalType,
      city,
      state,
      COUNT(*) AS reportCount,
      MIN(amount) AS minAmount,
      MAX(amount) AS maxAmount,
      ROUND(AVG(amount)) AS avgAmount
    FROM reports
    ${where}
    GROUP BY hospital, hospital_type, city, state
    ORDER BY avgAmount ASC
  `).all(params);

  if (byHospital.length === 0) {
    return res.status(404).json({ error: 'No reports found for this procedure' });
  }

  const overall = db.prepare(`
    SELECT
      COUNT(*) AS reportCount,
      MIN(amount) AS minAmount,
      MAX(amount) AS maxAmount,
      ROUND(AVG(amount)) AS avgAmount
    FROM reports
    ${where}
  `).get(params);

  res.json({ procedure, overall, byHospital });
});

module.exports = router;
