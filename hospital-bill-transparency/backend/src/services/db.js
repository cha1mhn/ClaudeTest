const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const logger = require('../utils/logger');
const { SEED_REPORTS } = require('./seedData');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/reports.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    procedure TEXT NOT NULL,
    category TEXT NOT NULL,
    hospital TEXT NOT NULL,
    hospital_type TEXT NOT NULL DEFAULT 'private',
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_type TEXT NOT NULL DEFAULT 'cash',
    room_type TEXT,
    notes TEXT,
    bill_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_reports_procedure ON reports(procedure);
  CREATE INDEX IF NOT EXISTS idx_reports_hospital ON reports(hospital);
  CREATE INDEX IF NOT EXISTS idx_reports_city ON reports(city);
`);

function seedIfEmpty() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM reports').get();
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO reports
      (procedure, category, hospital, hospital_type, city, state, amount, payment_type, room_type, notes, bill_date, created_at)
    VALUES
      (@procedure, @category, @hospital, @hospitalType, @city, @state, @amount, @paymentType, @roomType, @notes, @billDate, @createdAt)
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });

  insertMany(SEED_REPORTS);
  logger.info(`Seeded ${SEED_REPORTS.length} sample reports`);
}

seedIfEmpty();

module.exports = db;
