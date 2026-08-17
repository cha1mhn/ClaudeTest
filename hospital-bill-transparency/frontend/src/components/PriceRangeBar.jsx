import { formatCompact } from '../utils/format';

// Positions one hospital's average against the min–max range for the procedure,
// so a user can see at a glance whether a hospital sits cheap or expensive.
export default function PriceRangeBar({ value, min, max }) {
  const span = max - min;
  const pct = span > 0 ? ((value - min) / span) * 100 : 50;
  const tone = pct <= 33 ? 'var(--low)' : pct >= 67 ? 'var(--high)' : 'var(--warn)';

  return (
    <div style={{ minWidth: 150 }}>
      <div style={{ position: 'relative', height: 6, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 999 }}>
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(Math.max(pct, 0), 100)}%`,
            top: -3,
            width: 10,
            height: 10,
            marginLeft: -5,
            borderRadius: '50%',
            background: tone,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
        <span>{formatCompact(min)}</span>
        <span>{formatCompact(max)}</span>
      </div>
    </div>
  );
}
