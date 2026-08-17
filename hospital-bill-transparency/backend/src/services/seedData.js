// Illustrative starter data so the app is usable before real reports come in.
// Hospital names are fictional placeholders, not real institutions — the whole
// point of the platform is that real amounts come from real user submissions.

const HOSPITALS = [
  { hospital: 'City Care Hospital', hospitalType: 'private', city: 'Bengaluru', state: 'Karnataka' },
  { hospital: 'Sunrise Multispecialty Hospital', hospitalType: 'private', city: 'Bengaluru', state: 'Karnataka' },
  { hospital: 'Government General Hospital', hospitalType: 'government', city: 'Bengaluru', state: 'Karnataka' },
  { hospital: 'Metro General Hospital', hospitalType: 'private', city: 'Mumbai', state: 'Maharashtra' },
  { hospital: 'Lotus Health Institute', hospitalType: 'private', city: 'Mumbai', state: 'Maharashtra' },
  { hospital: 'Civic Municipal Hospital', hospitalType: 'government', city: 'Mumbai', state: 'Maharashtra' },
  { hospital: 'Northside Medical Center', hospitalType: 'private', city: 'Delhi', state: 'Delhi' },
  { hospital: 'Capital Trust Hospital', hospitalType: 'trust', city: 'Delhi', state: 'Delhi' },
  { hospital: 'Riverside Speciality Hospital', hospitalType: 'private', city: 'Chennai', state: 'Tamil Nadu' },
  { hospital: 'Marina Care Hospital', hospitalType: 'private', city: 'Chennai', state: 'Tamil Nadu' },
  { hospital: 'Greenfield Hospital', hospitalType: 'private', city: 'Hyderabad', state: 'Telangana' },
  { hospital: 'Charminar Government Hospital', hospitalType: 'government', city: 'Hyderabad', state: 'Telangana' },
  { hospital: 'Palm Grove Hospital', hospitalType: 'private', city: 'Pune', state: 'Maharashtra' },
  { hospital: 'Eastside Trust Hospital', hospitalType: 'trust', city: 'Kolkata', state: 'West Bengal' },
];

const PROCEDURES = [
  { procedure: 'Normal Delivery', category: 'Maternity', base: 35000, spread: 0.9 },
  { procedure: 'C-Section Delivery', category: 'Maternity', base: 75000, spread: 1.0 },
  { procedure: 'Appendectomy (Laparoscopic)', category: 'Surgery', base: 60000, spread: 0.8 },
  { procedure: 'Cataract Surgery (Phaco, per eye)', category: 'Surgery', base: 30000, spread: 1.1 },
  { procedure: 'Knee Replacement (Single)', category: 'Surgery', base: 250000, spread: 0.9 },
  { procedure: 'Angioplasty (Single Stent)', category: 'Cardiology', base: 200000, spread: 1.0 },
  { procedure: 'Gallbladder Removal (Laparoscopic)', category: 'Surgery', base: 70000, spread: 0.7 },
  { procedure: 'Dialysis (Single Session)', category: 'Nephrology', base: 2000, spread: 0.6 },
  { procedure: 'MRI - Brain', category: 'Diagnostic Imaging', base: 6000, spread: 1.2 },
  { procedure: 'CT Scan - Abdomen', category: 'Diagnostic Imaging', base: 5000, spread: 1.1 },
  { procedure: 'Root Canal Treatment', category: 'Dental', base: 6000, spread: 0.9 },
  { procedure: 'COVID-19 RT-PCR Test', category: 'Diagnostic', base: 500, spread: 1.4 },
];

const PAYMENT_TYPES = ['cash', 'insurance-cashless', 'insurance-reimbursement'];
const ROOM_TYPES = ['general', 'semi-private', 'private', 'icu', null];

// deterministic pseudo-random so seed data is stable across restarts
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

const SEED_REPORTS = [];
let daysAgo = 400;

for (const proc of PROCEDURES) {
  // each procedure gets reports from a random subset of hospitals, several times over
  const hospitalCount = 5 + Math.floor(rand() * (HOSPITALS.length - 5));
  const shuffled = [...HOSPITALS].sort(() => rand() - 0.5).slice(0, hospitalCount);

  for (const h of shuffled) {
    const reportsForThisHospital = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < reportsForThisHospital; i++) {
      const governmentDiscount = h.hospitalType === 'government' ? 0.35 : h.hospitalType === 'trust' ? 0.6 : 1;
      const variance = Math.max(0.35, 1 + (rand() * 2 - 1) * proc.spread);
      const amount = Math.max(200, Math.round((proc.base * governmentDiscount * variance) / 100) * 100);

      const billOffset = 20 + Math.floor(rand() * 380);
      const billDate = new Date(Date.now() - billOffset * 86400000).toISOString().slice(0, 10);
      // reported a week or three after the bill itself, so the "recent" feed reads naturally
      const reportOffset = Math.max(1, billOffset - (5 + Math.floor(rand() * 16)));
      const reportedAt = new Date(Date.now() - reportOffset * 86400000)
        .toISOString().replace('T', ' ').slice(0, 19);

      SEED_REPORTS.push({
        procedure: proc.procedure,
        category: proc.category,
        hospital: h.hospital,
        hospitalType: h.hospitalType,
        city: h.city,
        state: h.state,
        amount,
        paymentType: PAYMENT_TYPES[Math.floor(rand() * PAYMENT_TYPES.length)],
        roomType: ROOM_TYPES[Math.floor(rand() * ROOM_TYPES.length)],
        notes: null,
        billDate,
        createdAt: reportedAt,
      });
    }
  }
}

module.exports = { SEED_REPORTS, PROCEDURES, HOSPITALS };
