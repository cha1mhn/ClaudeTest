#!/usr/bin/env node
/**
 * CPU profiling script – isolates the three worst-performing cases
 * so `node --cpu-prof profile.js` produces a targeted .cpuprofile.
 *
 * Run with:
 *   node --cpu-prof benchmarks/profile.js
 * Then open the generated .cpuprofile in Chrome DevTools → Performance tab.
 */
'use strict';

const {
  deduplicateSlow,
  findUserSlow, buildUserIndex, findUserFast,
  fibSlow,
} = require('../src/utils.js');

const N = 5000;

// Fixtures (same as runner.js)
const bigArr    = Array.from({ length: N }, (_, i) => i % (N / 2));
const users     = Array.from({ length: N }, (_, i) => ({ id: i, name: `User${i}` }));
const lookupIds = Array.from({ length: 200 }, () => Math.floor(Math.random() * N));

console.log('[profile] warming up JIT …');

// ── Case 1: O(n²) deduplication ────────────────────────────────────────────
console.log('[profile] running deduplicateSlow …');
for (let i = 0; i < 20; i++) deduplicateSlow(bigArr);

// ── Case 2: O(n) linear scan per lookup ────────────────────────────────────
console.log('[profile] running findUserSlow …');
for (let i = 0; i < 10; i++) {
  for (const id of lookupIds) findUserSlow(users, id);
}

// ── Case 3: O(2ⁿ) recursive Fibonacci ─────────────────────────────────────
console.log('[profile] running fibSlow(33) …');
for (let i = 0; i < 3; i++) {
  // Use 33 instead of 35 so profiling doesn't take forever
  const fib = (n) => n <= 1 ? n : fib(n - 1) + fib(n - 2);
  fib(33);
}

console.log('[profile] done. If run with --cpu-prof, a .cpuprofile file was written.');
