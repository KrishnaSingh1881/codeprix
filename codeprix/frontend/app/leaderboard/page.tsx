'use client';

import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  members: number;
  score: number;
  solvedCount: number;
  avgTime: string;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaderboard`)
      .then((r) => r.json())
      .then((d) => setEntries(d.data || []))
      .catch(() => {});
  }, []);

  const rankColor = (r: number) => {
    if (r === 1) return '#FFD700';
    if (r === 2) return '#C0C0C0';
    if (r === 3) return '#CD7F32';
    return 'var(--text-muted)';
  };

  const rankLabel = (r: number) => {
    if (r === 1) return '🥇';
    if (r === 2) return '🥈';
    if (r === 3) return '🥉';
    return `P${r}`;
  };

  return (
    <div className="carbon-bg" style={{ paddingTop: 84 }}>
      <section className="section">
        <div className="racing-stripe animate-in" />
        <h1 className="section-title animate-in animate-delay-1">Leaderboard</h1>
        <p className="section-subtitle animate-in animate-delay-2">
          Real-time standings from the CodePrix championship. Fastest climbers. Hardest hitters.
        </p>

        {/* Podium top-3 */}
        {entries.length >= 3 && (
          <div className="animate-in animate-delay-3" style={{
            display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16,
            marginBottom: 48, padding: '0 20px',
          }}>
            {[entries[1], entries[0], entries[2]].map((e, i) => {
              const heights = [140, 180, 110];
              const podiumColors = ['#C0C0C0', '#FFD700', '#CD7F32'];
              return (
                <div key={e.id} style={{ textAlign: 'center', flex: 1, maxWidth: 200 }}>
                  <div style={{
                    fontFamily: 'var(--font-heading)', fontSize: '0.75rem', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
                    color: podiumColors[i],
                  }}>
                    {e.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {e.score} PTS
                  </div>
                  <div style={{
                    height: heights[i],
                    background: `linear-gradient(180deg, ${podiumColors[i]}22, ${podiumColors[i]}08)`,
                    border: `1px solid ${podiumColors[i]}44`,
                    borderRadius: '8px 8px 0 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 900,
                    color: podiumColors[i],
                  }}>
                    P{e.rank}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full standings table */}
        <div className="animate-in animate-delay-4" style={{
          background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '60px 1fr 120px 120px 120px',
            padding: '16px 24px', borderBottom: '1px solid var(--panel-border)',
            fontFamily: 'var(--font-heading)', fontSize: '0.65rem', fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)',
          }}>
            <span>Pos</span>
            <span>Team</span>
            <span style={{ textAlign: 'center' }}>Solved</span>
            <span style={{ textAlign: 'center' }}>Avg Time</span>
            <span style={{ textAlign: 'right' }}>Points</span>
          </div>

          {/* Rows */}
          {entries.map((e) => (
            <div
              key={e.id}
              style={{
                display: 'grid', gridTemplateColumns: '60px 1fr 120px 120px 120px',
                padding: '14px 24px', borderBottom: '1px solid var(--panel-border)',
                alignItems: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(ev) => { ev.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={(ev) => { ev.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{
                fontFamily: 'var(--font-heading)', fontSize: e.rank <= 3 ? '1.1rem' : '0.85rem',
                fontWeight: 700, color: rankColor(e.rank),
              }}>
                {rankLabel(e.rank)}
              </span>
              <span style={{
                fontFamily: 'var(--font-heading)', fontSize: '0.82rem', fontWeight: 600,
                letterSpacing: '0.04em',
              }}>
                {e.name}
              </span>
              <span style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {e.solvedCount}
              </span>
              <span style={{
                textAlign: 'center', fontFamily: 'var(--font-heading)', fontSize: '0.75rem',
                color: 'var(--text-secondary)', letterSpacing: '0.06em',
              }}>
                {e.avgTime}
              </span>
              <span style={{
                textAlign: 'right', fontFamily: 'var(--font-heading)', fontSize: '0.9rem',
                fontWeight: 700, color: e.rank <= 3 ? rankColor(e.rank) : '#fff',
              }}>
                {e.score}
              </span>
            </div>
          ))}
        </div>

        {/* Elimination zone indicator */}
        <div style={{
          marginTop: 24, padding: '16px 24px', borderRadius: 8,
          background: 'rgba(225, 6, 0, 0.06)', border: '1px solid rgba(225, 6, 0, 0.2)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: '1.2rem' }}>🚩</span>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--brand-red)' }}>Elimination Zone:</strong> Teams ranked P9 and below
            are at risk of elimination after each qualifying round. Stay above the cutoff to keep racing!
          </p>
        </div>
      </section>
    </div>
  );
}
