'use client';

import { useEffect, useState } from 'react';

interface Team {
  id: number;
  name: string;
  members: number;
  score: number;
  solvedCount: number;
  avgTime: string;
}

const teamColors = [
  '#E10600', '#FFD700', '#2196f3', '#00c853', '#ff5722',
  '#9c27b0', '#00bcd4', '#ff9800', '#e91e63', '#607d8b',
];

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`)
      .then((r) => r.json())
      .then((d) => setTeams(d.data || []))
      .catch(() => { });
  }, []);

  return (
    <div className="carbon-bg" style={{ paddingTop: 84 }}>
      <section className="section">
        <div className="racing-stripe animate-in" />
        <h1 className="section-title animate-in animate-delay-1">Teams</h1>
        <p className="section-subtitle animate-in animate-delay-2">
          Meet the competing teams on the CodePrix grid. Each one fighting for championship glory.
        </p>

        <div className="grid-auto" style={{ marginTop: 8 }}>
          {teams.map((team, i) => {
            const color = teamColors[i % teamColors.length];
            return (
              <div
                key={team.id}
                className="panel animate-in"
                style={{
                  animationDelay: `${0.08 * (i + 1)}s`,
                  borderTop: `3px solid ${color}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Background team number */}
                <div style={{
                  position: 'absolute', top: -8, right: 10,
                  fontFamily: 'var(--font-heading)', fontSize: '4.5rem', fontWeight: 900,
                  color: `${color}0D`, lineHeight: 1, pointerEvents: 'none',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* Team color strip icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: `${color}22`, border: `1px solid ${color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <span style={{ fontSize: '1.2rem' }}>🏎️</span>
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-heading)', fontSize: '0.88rem', fontWeight: 700,
                  letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12,
                }}>
                  {team.name}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
                      Members
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{team.members}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
                      Solved
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{team.solvedCount}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
                      Avg Time
                    </span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em' }}>
                      {team.avgTime}
                    </span>
                  </div>

                  <div style={{
                    marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--panel-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
                      Score
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800,
                      color,
                    }}>
                      {team.score}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
