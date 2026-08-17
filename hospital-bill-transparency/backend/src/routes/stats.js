const express = require('express');
const db = require('../services/db');

const router = express.Router();

// GET /api/stats/summary - homepage overview numbers
router.get('/summary', (req, res) => {
  const totals = db.prepare(`
    SELECT
      COUNT(*) AS totalReports,
      COUNT(DISTINCT hospital) AS totalHospitals,
      COUNT(DISTINCT city) AS totalCities,
      COUNT(DISTINCT procedure) AS totalProcedures
    FROM reports
  `).get();

  const biggestGaps = db.prepare(`
    SELECT
      procedure,
      category,
      COUNT(*) AS reportCount,
      MIN(amount) AS minAmount,
      MAX(amount) AS maxAmount,
      ROUND(AVG(amount)) AS avgAmount
    FROM reports
    GROUP BY procedure, category
    HAVING COUNT(*) >= 3
    ORDER BY (MAX(amount) * 1.0 / MIN(amount)) DESC
    LIMIT 5
  `).all().map((r) => ({ ...r, priceGapRatio: Number((r.maxAmount / r.minAmount).toFixed(1)) }));

  const byPaymentType = db.prepare(`
    SELECT payment_type AS paymentType, COUNT(*) AS count
    FROM reports GROUP BY payment_type
  `).all();

  const byHospitalType = db.prepare(`
    SELECT hospital_type AS hospitalType, ROUND(AVG(amount)) AS avgAmount, COUNT(*) AS count
    FROM reports GROUP BY hospital_type
  `).all();

  const recentReports = db.prepare(`
    SELECT id, procedure, hospital, city, amount, created_at AS createdAt
    FROM reports ORDER BY created_at DESC, id DESC LIMIT 8
  `).all();

  res.json({ totals, biggestGaps, byPaymentType, byHospitalType, recentReports });
});

// GET /api/stats/cities - distinct cities/states for filter dropdowns
router.get('/cities', (req, res) => {
  const rows = db.prepare(`SELECT DISTINCT city, state FROM reports ORDER BY city ASC`).all();
  res.json({ data: rows });
});

// GET /api/stats/categories
router.get('/categories', (req, res) => {
  const rows = db.prepare(`SELECT DISTINCT category FROM reports ORDER BY category ASC`).all();
  res.json({ data: rows.map((r) => r.category) });
});

module.exports = router;
