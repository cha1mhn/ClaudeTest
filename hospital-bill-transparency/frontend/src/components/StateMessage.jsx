export function Loading({ label = 'Loading…' }) {
  return <div className="loading">{label}</div>;
}

export function ErrorMessage({ error }) {
  return <div className="notice error">{error}</div>;
}

export function Empty({ label = 'No reports yet.' }) {
  return <div className="empty">{label}</div>;
}
