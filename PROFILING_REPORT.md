# Performance Profiling Report

## Benchmark Results

| # | Case | Slow | Fast | Speedup |
|---|------|------|------|---------|
| 1 | Fibonacci(35) | 82.72ms/op | 38.6µs/op | **2141x** |
| 2 | Object lookup (500×, pool=5000) | 3.16ms/op | 42.9µs/op | **73.5x** |
| 3 | Array deduplication (n=5000) | 6.40ms/op | 161.5µs/op | **39.6x** |
| 4 | Sort by date (1000 items) | 5.64ms/op | 457.2µs/op | **12.3x** |
| 5 | String building (2000 words) | 47.1µs/op | 32.1µs/op | **1.5x** |
| 6 | Deep clone (5000 users) | 3.31ms/op | 3.42ms/op | ~1x (tie) |

---

## CPU Profile Summary (`node --cpu-prof`)

```
 38.9%  fib [profile.js]          ← recursive fibonacci dominates
  7.9%  findUserSlow [utils.js]   ← Array#find called 500×/op
  2.2%  deduplicateSlow [utils.js]← indexOf in a loop
  0.8%  (garbage collector)       ← minor, from temporary arrays
```

The profile confirms the theoretical complexity analysis:
- Fibonacci recursion accounts for **~39% of total sampled CPU time**.
- Linear scan lookups account for **~8%**.
- The O(n²) deduplication accounts for **~2%** (smaller because n=5000 and iterations were lower).

---

## Root Cause Analysis & Fixes

### 1. Fibonacci — O(2ⁿ) → O(n)

**Root cause:** Each call spawns two recursive sub-calls, leading to ~2³⁵ ≈ 34 billion operations.
The call tree has massive duplicate sub-problem recalculation with no memoization.

**Fix:** Iterative bottom-up calculation. No stack frames, no repeated work.

```js
// BEFORE (slow)
function fibSlow(n) {
  if (n <= 1) return n;
  return fibSlow(n - 1) + fibSlow(n - 2);   // 2ⁿ calls
}

// AFTER (fast)
function fibFast(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const c = a + b; a = b; b = c;           // n iterations
  }
  return b;
}
```

**Speedup: 2141x**

---

### 2. Object lookup in hot loop — O(n) per lookup → O(1)

**Root cause:** `Array#find` scans up to all N elements for every lookup.
With 500 lookups against a pool of 5000 users: up to 2.5 million comparisons per call.

**Fix:** Pre-build a `Map<id, user>` once; subsequent lookups are O(1) hash table gets.

```js
// BEFORE (slow)
function findUserSlow(users, id) {
  return users.find(u => u.id === id);       // O(n) each time
}

// AFTER (fast)
const index = new Map(users.map(u => [u.id, u]));  // O(n) once
function findUserFast(index, id) {
  return index.get(id);                             // O(1)
}
```

**Speedup: 73.5x**

---

### 3. Array deduplication — O(n²) → O(n)

**Root cause:** `Array#indexOf` does a linear scan of the `result` array for every element.
In the worst case (all unique), this is 0+1+2+…+(n-1) = n(n-1)/2 comparisons.

**Fix:** `Set` internally uses a hash table — insertion and lookup are O(1) amortized.

```js
// BEFORE (slow)
function deduplicateSlow(arr) {
  const result = [];
  for (const item of arr) {
    if (result.indexOf(item) === -1) result.push(item);  // O(n) each
  }
  return result;
}

// AFTER (fast)
function deduplicateFast(arr) {
  return [...new Set(arr)];                               // O(n) total
}
```

**Speedup: 39.6x**

---

### 4. Sort with expensive comparator — parse once (Schwartzian transform)

**Root cause:** `new Date(str)` is called on every comparison. A sort of n elements
makes O(n log n) comparisons, so the date is parsed repeatedly for the same item.

**Fix:** Map each item to `{ item, ts }` once (O(n)), sort by the pre-computed `ts` (O(n log n)
comparisons but all integer), then map back (O(n)).

**Speedup: 12.3x**

---

### 5. String concatenation — minor

`+=` on strings creates a new string object every iteration. `Array#join` allocates once.
With only 2000 words, the absolute difference is small (47µs vs 32µs), but the pattern
matters at scale.

**Speedup: 1.5x**

---

### 6. Deep clone — `structuredClone` vs JSON round-trip

Surprisingly, `JSON.parse(JSON.stringify())` and `structuredClone` perform almost identically
for large plain-object graphs. V8's JSON serializer is highly optimized native C++.
`structuredClone` is preferred for correctness (handles Dates, Maps, Sets, circular refs)
but has no meaningful performance advantage for JSON-serializable data at this scale.

---

## Profiling Tools Used

- `process.hrtime.bigint()` — nanosecond-precision wall-clock timing in the benchmark runner
- `node --cpu-prof` — V8 CPU sampling profiler (output: `.cpuprofile`, open in Chrome DevTools)

CPU profiles are stored in `profiles/`.
