'use client';

import { useEffect, useState } from 'react';

interface Question {
  id: number;
  category: string;
  title: string;
  description: string;
  difficulty: string;
}

const categoryMeta: Record<string, { icon: string; color: string; tagline: string }> = {
  'Speed Coding':      { icon: '⚡', color: '#E10600', tagline: 'Race against the clock — solve coding problems as fast as you can.' },
  'Logical Reasoning': { icon: '🧠', color: '#2196f3', tagline: 'Put your deductive skills to the test with tricky logic puzzles.' },
  'Aptitude':          { icon: '📐', color: '#ffab00', tagline: 'Sharpen your quantitative and analytical reasoning.' },
  'Fun':               { icon: '🎲', color: '#00c853', tagline: 'Creative, quirky, and unexpected challenges to keep things spicy.' },
};

export default function ChallengesPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [openCat, setOpenCat] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.data || []))
      .catch(() => {});
  }, []);

  const categories = Object.keys(categoryMeta);

  const diffBadge = (d: string) => {
    const map: Record<string, string> = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' };
    return map[d] || 'badge';
  };

  return (
    <div className="carbon-bg" style={{ paddingTop: 84 }}>
      <section className="section">
        <div className="racing-stripe animate-in" />
        <h1 className="section-title animate-in animate-delay-1">Challenges</h1>
        <p className="section-subtitle animate-in animate-delay-2">
          Four categories. Increasing difficulty. Only the sharpest coders survive the gauntlet.
        </p>

        <div style={{ display: 'grid', gap: 24, marginTop: 8 }}>
          {categories.map((cat, i) => {
            const meta = categoryMeta[cat];
            const catQuestions = questions.filter((q) => q.category === cat);
            const isOpen = openCat === cat;

            return (
              <div
                key={cat}
                className="animate-in"
                style={{ animationDelay: `${0.1 * (i + 1)}s` }}
              >
                {/* Category Header Card */}
                <div
                  className="panel"
                  style={{
                    cursor: 'pointer',
                    borderLeft: `3px solid ${meta.color}`,
                    borderRadius: isOpen ? '12px 12px 0 0' : 12,
                  }}
                  onClick={() => setOpenCat(isOpen ? null : cat)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontSize: '2rem' }}>{meta.icon}</span>
                      <div>
                        <h3 style={{
                          fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>
                          {cat}
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
                        {catQuestions.length} Questions
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

                {/* Expandable Questions */}
                {isOpen && (
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--panel-border)',
                    borderTop: 'none',
                    borderRadius: '0 0 12px 12px',
                    overflow: 'hidden',
                  }}>
                    {catQuestions.map((q, qi) => (
                      <div
                        key={q.id}
                        style={{
                          padding: '20px 28px',
                          borderBottom: qi < catQuestions.length - 1 ? '1px solid var(--panel-border)' : 'none',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{
                              fontFamily: 'var(--font-heading)', fontSize: '0.7rem', fontWeight: 700,
                              color: 'var(--text-muted)',
                            }}>
                              Q{qi + 1}
                            </span>
                            <h4 style={{
                              fontFamily: 'var(--font-heading)', fontSize: '0.82rem', fontWeight: 600,
                              letterSpacing: '0.04em',
                            }}>
                              {q.title}
                            </h4>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {q.description}
                          </p>
                        </div>
                        <span className={`badge ${diffBadge(q.difficulty)}`}>
                          {q.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
