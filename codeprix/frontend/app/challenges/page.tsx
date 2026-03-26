'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Question {
  id: string;
  sector: number;
  body: string;
  difficulty?: string; // Note: SQL schema didn't have difficulty, but we'll fallback
}

const sectorMeta: Record<number, { title: string; icon: string; color: string; tagline: string }> = {
  1: { title: 'Sector 1: Speed Coding', icon: '⚡', color: '#E10600', tagline: 'Race against the clock — solve coding problems as fast as you can.' },
  2: { title: 'Sector 2: Logical Reasoning', icon: '🧠', color: '#2196f3', tagline: 'Put your deductive skills to the test with tricky logic puzzles.' },
  3: { title: 'Sector 3: Aptitude & Creative', icon: '🧩', color: '#ffab00', tagline: 'Sharpen your analytical reasoning and solve unique challenges.' },
};

export default function ChallengesPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [openSector, setOpenSector] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase.from('questions').select('id, sector, body');
      if (!error && data) {
        setQuestions(data as Question[]);
      }
      setLoading(false);
    };
    fetchQuestions();
  }, []);

  const diffBadge = (d: string | undefined) => {
    const map: Record<string, string> = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' };
    return map[d || 'Medium'] || 'badge';
  };

  return (
    <div className="carbon-bg" style={{ paddingTop: 84, minHeight: '100vh' }}>
      <section className="section">
        <div className="racing-stripe animate-in" />
        <h1 className="section-title animate-in animate-delay-1">Challenges</h1>
        <p className="section-subtitle animate-in animate-delay-2">
          Three sectors. Adrenaline-fueled coding. Only the sharpest survives the gauntlet.
        </p>

        {loading ? (
          <div className="mt-12 text-center font-racing text-white/30 uppercase tracking-[0.3em]">Loading Grid...</div>
        ) : (
          <div style={{ display: 'grid', gap: 24, marginTop: 8 }}>
            {[1, 2, 3].map((sNum, i) => {
              const meta = sectorMeta[sNum];
              const sectorQuestions = questions.filter((q) => Number(q.sector) === sNum);
              const isOpen = openSector === sNum;

              return (
                <div
                  key={sNum}
                  className="animate-in"
                  style={{ animationDelay: `${0.1 * (i + 1)}s` }}
                >
                  <div
                    className={`panel transition-all duration-300 ${isOpen ? 'border-[#E10600]/30' : ''}`}
                    style={{
                      cursor: 'pointer',
                      borderLeft: `3px solid ${meta.color}`,
                      borderRadius: isOpen ? '12px 12px 0 0' : 12,
                    }}
                    onClick={() => setOpenSector(isOpen ? null : sNum)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: '2rem' }}>{meta.icon}</span>
                        <div>
                          <h3 style={{
                            fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                          }}>
                            {meta.title}
                          </h3>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                            {meta.tagline}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="badge" style={{
                          background: `${meta.color}18`, color: meta.color,
                          borderColor: `${meta.color}44`,
                        }}>
                          {sectorQuestions.length} Questions
                        </span>
                        <span style={{
                          fontSize: '1.2rem', color: 'var(--text-muted)',
                          transition: 'transform 0.3s',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}>
                          ▼
                        </span>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--panel-border)',
                      borderTop: 'none',
                      borderRadius: '0 0 12px 12px',
                      overflow: 'hidden',
                    }}>
                      {sectorQuestions.length === 0 ? (
                        <div className="p-8 text-center text-white/20 font-racing text-xs uppercase tracking-[0.2em]">No data from telemetry</div>
                      ) : (
                        sectorQuestions.map((q, qi) => (
                          <div
                            key={q.id}
                            style={{
                              padding: '20px 28px',
                              borderBottom: qi < sectorQuestions.length - 1 ? '1px solid var(--panel-border)' : 'none',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <span style={{
                                  fontFamily: 'var(--font-heading)', fontSize: '0.7rem', fontWeight: 700,
                                  color: 'var(--text-muted)',
                                }}>
                                  # {qi + 1}
                                </span>
                                <h4 style={{
                                  fontFamily: 'var(--font-heading)', fontSize: '0.82rem', fontWeight: 600,
                                  letterSpacing: '0.04em',
                                }}>
                                  Technological Challenge
                                </h4>
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {q.body}
                              </p>
                            </div>
                            <span className={`badge ${diffBadge(q.difficulty)}`}>
                              {q.difficulty || 'Medium'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
