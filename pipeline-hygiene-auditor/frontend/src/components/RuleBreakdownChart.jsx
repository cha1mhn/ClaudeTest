import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#F2547D', '#FF7A59', '#F5C26B', '#0091AE', '#00BDA5', '#516F90'];

export default function RuleBreakdownChart({ issuesByRule = [] }) {
  if (!issuesByRule.length) return null;

  const data = issuesByRule.map((g) => ({
    name: g.ruleId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    count: g.count,
  })).sort((a, b) => b.count - a.count);

  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>Issues by Rule</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles = {
  wrap: { background: '#fff', borderRadius: 8, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
  title: { fontSize: 14, fontWeight: 700, color: '#33475B', marginBottom: 16 },
};
