/**
 * Utility functions - some with performance bottlenecks, some optimized.
 * Bottlenecks are intentional for benchmarking/profiling purposes.
 */

// ─── CASE 1: Array deduplication ───────────────────────────────────────────

/** SLOW: O(n²) – uses indexOf inside a loop */
function deduplicateSlow(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (result.indexOf(arr[i]) === -1) {
      result.push(arr[i]);
    }
  }
  return result;
}

/** FAST: O(n) – uses a Set */
function deduplicateFast(arr) {
  return [...new Set(arr)];
}

// ─── CASE 2: String building ────────────────────────────────────────────────

/** SLOW: repeated string concatenation inside a loop (O(n²) due to immutable strings) */
function buildStringSlow(items) {
  let result = '';
  for (const item of items) {
    result += item + ',';
  }
  return result.slice(0, -1);
}

/** FAST: collect then join once */
function buildStringFast(items) {
  return items.join(',');
}

// ─── CASE 3: Object lookup in a hot loop ────────────────────────────────────

/** SLOW: linear search through array of objects on every call */
function findUserSlow(users, id) {
  return users.find(u => u.id === id);
}

/** FAST: pre-built Map for O(1) lookups */
function buildUserIndex(users) {
  return new Map(users.map(u => [u.id, u]));
}
function findUserFast(index, id) {
  return index.get(id);
}

// ─── CASE 4: Fibonacci ──────────────────────────────────────────────────────

/** SLOW: naive recursive – exponential O(2ⁿ) */
function fibSlow(n) {
  if (n <= 1) return n;
  return fibSlow(n - 1) + fibSlow(n - 2);
}

/** FAST: iterative – linear O(n) */
function fibFast(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const c = a + b;
    a = b;
    b = c;
  }
  return b;
}

// ─── CASE 5: Sorting with expensive comparator ──────────────────────────────

/** SLOW: re-parses date string on every comparison */
function sortByDateSlow(items) {
  return [...items].sort((a, b) => new Date(a.date) - new Date(b.date));
}

/** FAST: Schwartzian transform – parse once */
function sortByDateFast(items) {
  return items
    .map(item => ({ item, ts: new Date(item.date).getTime() }))
    .sort((a, b) => a.ts - b.ts)
    .map(({ item }) => item);
}

// ─── CASE 6: Deep clone ─────────────────────────────────────────────────────

/** SLOW: JSON round-trip (slow serialization + loses non-JSON types) */
function deepCloneSlow(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/** FAST: structured clone (native, handles more types) */
function deepCloneFast(obj) {
  return structuredClone(obj);
}

module.exports = {
  deduplicateSlow, deduplicateFast,
  buildStringSlow, buildStringFast,
  findUserSlow, buildUserIndex, findUserFast,
  fibSlow, fibFast,
  sortByDateSlow, sortByDateFast,
  deepCloneSlow, deepCloneFast,
};
