import React, { useState } from 'react';

const SEV_COLORS = { critical: '#F2547D', high: '#FF7A59', warning: '#F5C26B', info: '#7C98B6' };

const RULE_ICONS = {
  'stale-deal': '\u23F1',
  'missing-fields': '\u26A0',
  'past-due-close': '\uD83D\uDCC5',
  'no-contacts': '\uD83D\uDC64',
  'enrichment-gap': '\uD83E\uDDE9',
  'pipeline-bottleneck': '\u26D4',
};

export default function IssueList({ issuesByRule = [] }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (ruleId) => setExpanded((prev) => ({ ...prev, [ruleId]: !prev[ruleId] }));

  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>Issues by Rule</h3>
      {issuesByRule.length === 0 ? (
        <p style={styles.clean}>No issues found — pipeline is clean.</p>
      ) : (
        issuesByRule.map((group) => {
          const isOpen = expanded[group.ruleId];
          const topSeverity = group.issues.reduce((worst, i) => {
            const order = ['critical', 'high', 'warning', 'info'];
            return order.indexOf(i.severity) < order.indexOf(worst) ? i.severity : worst;
          }, 'info');

          return (
            <div key={group.ruleId} style={styles.group}>
              <div style={styles.groupHeader} onClick={() => toggle(group.ruleId)}>
                <span style={styles.icon}>{RULE_ICONS[group.ruleId] || '\u2022'}</span>
                <span style={styles.ruleTitle}>
                  {group.ruleId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                <span style={{ ...styles.badge, background: SEV_COLORS[topSeverity] }}>
                  {group.count}
                </span>
                <span style={styles.chevron}>{isOpen ? '\u25B2' : '\u25BC'}</span>
              </div>

              {isOpen && (
                <div style={styles.issues}>
                  {group.issues.slice(0, 50).map((issue, i) => (
                    <div key={i} style={styles.issue}>
                      <span style={{ ...styles.sevDot, background: SEV_COLORS[issue.severity] }} />
                      <div>
                        <div style={styles.issueTitle}>{issue.title}</div>
                        <div style={styles.issueMsg}>{issue.message}</div>
                      </div>
                    </div>
                  ))}
                  {group.count > 50 && (
                    <p style={styles.more}>...and {group.count - 50} more</p>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

const styles = {
  wrap: { background: '#fff', borderRadius: 8, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
  title: { fontSize: 14, fontWeight: 700, color: '#33475B', marginBottom: 16 },
  clean: { color: '#00BDA5', fontWeight: 600, fontSize: 14 },
  group: { borderBottom: '1px solid #EAF0F6', paddingBottom: 8, marginBottom: 8 },
  groupHeader: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 0' },
  icon: { fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 },
  ruleTitle: { flex: 1, fontWeight: 600, fontSize: 13, color: '#33475B' },
  badge: { color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '2px 8px', minWidth: 24, textAlign: 'center' },
  chevron: { fontSize: 10, color: '#7C98B6', flexShrink: 0 },
  issues: { paddingLeft: 32, paddingTop: 4 },
  issue: { display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0' },
  sevDot: { width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0 },
  issueTitle: { fontSize: 12, fontWeight: 600, color: '#33475B' },
  issueMsg: { fontSize: 12, color: '#7C98B6', lineHeight: 1.4 },
  more: { fontSize: 12, color: '#7C98B6', fontStyle: 'italic', paddingTop: 4 },
};
