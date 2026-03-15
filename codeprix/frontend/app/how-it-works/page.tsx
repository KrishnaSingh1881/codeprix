import ScrollBgCanvas from '@/components/ScrollBgCanvas';

export default function HowItWorks() {
  const steps = [
    {
      phase: 'FORMATION LAP',
      title: 'Assemble Your Team',
      desc: 'Form a team of 3–4 members. Register your team with a name and get ready for the grid. Every team starts on equal footing — no head starts here.',
      accent: '#00c853',
    },
    {
      phase: 'ROUND 1–3',
      title: 'Race Through Challenges',
      desc: 'Each round features a different type of challenge: Speed Coding, Logical Reasoning, Aptitude, or Fun/Creative questions. Teams solve as many problems as they can within the time limit.',
      accent: 'var(--brand-red)',
    },
    {
      phase: 'SCORING',
      title: 'Points Calculation',
      desc: 'Points are awarded based on the number of correct answers and the time taken. Faster and more accurate teams earn higher scores. Think of it as your lap time plus accuracy bonus.',
      accent: 'var(--brand-yellow)',
    },
    {
      phase: 'STANDINGS',
      title: 'Leaderboard Update',
      desc: 'After each round, the leaderboard is recalculated. Teams can see their position, how they compare to rivals, and what they need to survive the next elimination.',
      accent: '#2196f3',
    },
    {
      phase: 'PIT STOP',
      title: 'Elimination Round',
      desc: 'After designated rounds, the teams at the bottom of the leaderboard are eliminated — just like in an F1 qualifying session. Only the top teams advance to the next stage.',
      accent: '#ff5722',
    },
    {
      phase: 'GRAND PRIX',
      title: 'Final Showdown',
      desc: 'The surviving teams compete in the Grand Prix final: a high-pressure rapid-fire round. The team with the most points at the end takes the CodePrix championship title.',
      accent: '#FFD700',
    },
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <ScrollBgCanvas folder="frames2" total={240} blur={8} dimOpacity={0.6} />

      {/* Page content sits above the canvas */}
      <div className="carbon-bg" style={{ paddingTop: 84, position: 'relative', zIndex: 1, background: 'transparent' }}>
      <section className="section">
        <div className="racing-stripe animate-in" />
        <h1 className="section-title animate-in animate-delay-1">How It Works</h1>
        <p className="section-subtitle animate-in animate-delay-2">
          CodePrix follows a multi-round elimination format inspired by Formula 1 qualifying.
          Think you&apos;re fast enough? Here&apos;s the breakdown.
        </p>

        {/* Timeline */}
        <div style={{ position: 'relative', marginTop: 24 }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: 28, top: 0, bottom: 0, width: 2,
            background: 'linear-gradient(180deg, var(--brand-red), rgba(225,6,0,0.1))',
          }} />

          {steps.map((step, i) => (
            <div
              key={i}
              className="animate-in"
              style={{
                display: 'flex', gap: 32, marginBottom: 40, position: 'relative',
                animationDelay: `${0.15 * (i + 1)}s`,
              }}
            >
              {/* Dot */}
              <div style={{
                flexShrink: 0, width: 58, display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: step.accent, border: '3px solid var(--brand-dark)',
                  boxShadow: `0 0 12px ${step.accent}`,
                  position: 'relative', zIndex: 2,
                }} />
              </div>

              {/* Content */}
              <div className="panel" style={{ flex: 1 }}>
                <span style={{
                  fontFamily: 'var(--font-heading)', fontSize: '0.65rem', fontWeight: 600,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: step.accent, display: 'block', marginBottom: 8,
                }}>
                  {step.phase}
                </span>
                <h3 style={{
                  fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700,
                  marginBottom: 10, letterSpacing: '0.04em',
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Scoring breakdown box */}
        <div className="panel animate-in" style={{ marginTop: 40, borderLeft: '3px solid var(--brand-red)' }}>
          <h3 style={{
            fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16,
            color: 'var(--brand-red)',
          }}>
            ⚙️ Scoring Formula
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { label: 'Correct Answers', value: '+100 pts each', icon: '✅' },
              { label: 'Speed Bonus', value: 'Up to +50 pts', icon: '⏱️' },
              { label: 'Wrong Answers', value: '−20 pts each', icon: '❌' },
              { label: 'Elimination', value: 'Bottom 2 teams', icon: '🚫' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
