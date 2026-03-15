export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}

export function growthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function weightedAverage(
  values: number[],
  weights: number[]
): number {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;
  const weightedSum = values.reduce((sum, v, i) => sum + v * weights[i], 0);
  return weightedSum / totalWeight;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function sumBy<T>(items: T[], fn: (item: T) => number): number {
  return items.reduce((sum, item) => sum + fn(item), 0);
}
