#!/usr/bin/env node
'use strict';

const {
  deduplicateSlow, deduplicateFast,
  buildStringSlow, buildStringFast,
  findUserSlow, buildUserIndex, findUserFast,
  fibSlow, fibFast,
  sortByDateSlow, sortByDateFast,
  deepCloneSlow, deepCloneFast,
} = require('../src/utils.js');

// ─── helpers ────────────────────────────────────────────────────────────────

function time(label, fn, iterations = 1) {
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) fn();
  const ns = Number(process.hrtime.bigint() - start);
  return { label, ms: ns / 1e6, iterations };
}

function fmt(ms) {
  return ms < 1 ? `${(ms * 1000).toFixed(1)}µs` : `${ms.toFixed(2)}ms`;
}

// ─── fixtures ────────────────────────────────────────────────────────────────

const N = 5000;
const bigArr = Array.from({ length: N }, (_, i) => i % (N / 2)); // 50% duplicates

const words = Array.from({ length: 2000 }, (_, i) => `word${i}`);

const users = Array.from({ length: N }, (_, i) => ({
  id: i,
  name: `User${i}`,
  email: `user${i}@example.com`,
}));
const userIndex = buildUserIndex(users);
const lookupIds = Array.from({ length: 500 }, () => Math.floor(Math.random() * N));

const FIB_N = 35;

const dateItems = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  date: new Date(Date.now() - Math.random() * 1e10).toISOString(),
  value: Math.random(),
}));

const bigObj = { users, meta: { count: N, tags: words.slice(0, 50) } };

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  const chalk = (await import('chalk')).default;

  function printResult(slow, fast) {
    const ratio = slow.ms / fast.ms;
    const slowStr = chalk.red(`${fmt(slow.ms / slow.iterations)}/op`);
    const fastStr = chalk.green(`${fmt(fast.ms / fast.iterations)}/op`);
    const speedup =
      ratio >= 1
        ? chalk.cyan(`${ratio.toFixed(1)}x faster`)
        : chalk.yellow(`${(1 / ratio).toFixed(1)}x slower`);

    console.log(`  slow  ${slowStr.padEnd(38)}  ${chalk.dim(slow.label)}`);
    console.log(`  fast  ${fastStr.padEnd(38)}  ${chalk.dim(fast.label)}`);
    console.log(`  ${speedup}`);
    console.log();
    return {
      name: slow.label,
      slowMs: slow.ms / slow.iterations,
      fastMs: fast.ms / fast.iterations,
      ratio,
    };
  }

  const results = [];

  console.log(chalk.bold.white('\n══════════════════════════════════════════'));
  console.log(chalk.bold.white('   Performance Benchmark Suite'));
  console.log(chalk.bold.white('══════════════════════════════════════════\n'));

  // 1. Deduplication
  console.log(chalk.bold.yellow(`1. Array deduplication  (n=${N}, 50% dupes)`));
  results.push(
    printResult(
      time('indexOf loop (O(n²))', () => deduplicateSlow(bigArr), 50),
      time('Set spread   (O(n))', () => deduplicateFast(bigArr), 50),
    ),
  );

  // 2. String building
  console.log(chalk.bold.yellow(`2. String building  (${words.length} words)`));
  results.push(
    printResult(
      time('concat loop', () => buildStringSlow(words), 500),
      time('Array#join', () => buildStringFast(words), 500),
    ),
  );

  // 3. Object lookup
  console.log(
    chalk.bold.yellow(
      `3. Object lookup in hot loop  (${lookupIds.length} lookups, pool=${N})`,
    ),
  );
  results.push(
    printResult(
      time(
        'Array#find  (O(n) each)',
        () => {
          for (const id of lookupIds) findUserSlow(users, id);
        },
        20,
      ),
      time(
        'Map#get     (O(1) each)',
        () => {
          for (const id of lookupIds) findUserFast(userIndex, id);
        },
        20,
      ),
    ),
  );

  // 4. Fibonacci
  console.log(chalk.bold.yellow(`4. Fibonacci(${FIB_N})`));
  results.push(
    printResult(
      time('naive recursion (O(2ⁿ))', () => fibSlow(FIB_N), 5),
      time('iterative       (O(n))', () => fibFast(FIB_N), 5),
    ),
  );

  // 5. Sort with expensive comparator
  console.log(chalk.bold.yellow(`5. Sort by date  (${dateItems.length} items)`));
  results.push(
    printResult(
      time('new Date() per compare', () => sortByDateSlow(dateItems), 200),
      time('Schwartzian transform', () => sortByDateFast(dateItems), 200),
    ),
  );

  // 6. Deep clone
  console.log(chalk.bold.yellow(`6. Deep clone  (object with ${N} users)`));
  results.push(
    printResult(
      time('JSON round-trip', () => deepCloneSlow(bigObj), 30),
      time('structuredClone', () => deepCloneFast(bigObj), 30),
    ),
  );

  // ─── summary ───────────────────────────────────────────────────────────────

  console.log(chalk.bold.white('══════════════════════════════════════════'));
  console.log(chalk.bold.white('   Summary – worst → best speedup'));
  console.log(chalk.bold.white('══════════════════════════════════════════\n'));

  results
    .sort((a, b) => b.ratio - a.ratio)
    .forEach((r, i) => {
      const bar = '█'.repeat(Math.min(Math.round(r.ratio / 2), 40));
      const color = r.ratio > 100 ? chalk.red : r.ratio > 10 ? chalk.yellow : chalk.green;
      console.log(`  ${i + 1}. ${color(r.name)}`);
      console.log(`     ${chalk.cyan(r.ratio.toFixed(1) + 'x')}  ${chalk.dim(bar)}`);
    });

  console.log();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
