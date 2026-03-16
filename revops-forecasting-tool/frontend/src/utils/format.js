export function formatCurrency(value, currency = 'USD') {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPct(value) {
  if (value == null) return '—';
  return `${value}%`;
}

export function formatNumber(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

export function periodLabel(key) {
  // 2024-Q3 → Q3 2024  |  2024-03 → Mar 2024
  if (!key) return '';
  if (key.includes('Q')) {
    const [year, q] = key.split('-');
    return `${q} ${year}`;
  }
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
