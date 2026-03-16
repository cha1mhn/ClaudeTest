import React from 'react';

const GRADE_COLORS = {
  A: '#00BDA5', B: '#00A4BD', C: '#F5C26B', D: '#FF7A59', F: '#F2547D',
};

export default function GradeRing({ grade, score }) {
  const color = GRADE_COLORS[grade] || '#7C98B6';
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={styles.wrap}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#EAF0F6" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={styles.center}>
        <span style={{ ...styles.grade, color }}>{grade}</span>
        <span style={styles.score}>{score}/100</span>
      </div>
    </div>
  );
}

const styles = {
  wrap: { position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', textAlign: 'center', lineHeight: 1.2 },
  grade: { display: 'block', fontSize: 42, fontWeight: 900 },
  score: { display: 'block', fontSize: 13, color: '#7C98B6', fontWeight: 600 },
};
