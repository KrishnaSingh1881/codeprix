import HeroAnimation from '@/components/HeroAnimation';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <HeroAnimation />

      {/* ── Event Intro ── */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="racing-stripe" style={{ margin: '0 auto 20px' }} />
        <h2 className="section-title" style={{ textAlign: 'center' }}>
          The Ultimate Coding Race
        </h2>
        <p className="section-subtitle" style={{ margin: '0 auto 24px', textAlign: 'center' }}>
          CodePrix is the ultimate competitive coding event inspired by the adrenaline of Formula 1.
          Teams race through multiple rounds of challenges — from speed coding to brain-twisting puzzles —
          battling for the top spot on the leaderboard. Only the fastest and smartest survive.
        </p>
        <Link href="/how-it-works" className="btn-racing">
          Discover the Format →
        </Link>
      </section>

      {/* ── How It Works Overview ── */}
      <section className="section carbon-bg speed-lines">
        <div className="racing-stripe" />
        <h2 className="section-title">Race Format</h2>
        <p className="section-subtitle">
          Three stages. One champion. Here&apos;s the pit-stop overview.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {[
            {
              num: '01',
              title: 'Form Your Team',
              desc: 'Assemble a squad of 3–4 coders. Choose your team name — every F1 team needs an identity.',
              icon: '🏁',
            },
            {
              num: '02',
              title: 'Race Through Rounds',
              desc: 'Tackle speed coding, logic puzzles, aptitude challenges, and creative problems across multiple rounds.',
              icon: '⚡',
            },
            {
              num: '03',
              title: 'Climb or Crash',
              desc: 'Points are calculated from correct answers and speed. Bottom teams get eliminated after each round.',
              icon: '🏆',
            },
          ].map((step) => (
            <div key={step.num} className="panel animate-in" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 12, right: 16,
                fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 900,
                color: 'rgba(225, 6, 0, 0.08)', lineHeight: 1,
              }}>
                {step.num}
              </div>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: 12 }}>{step.icon}</span>
              <h3 style={{
                fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10,
              }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Explore Sections ── */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="racing-stripe" style={{ margin: '0 auto 20px' }} />
        <h2 className="section-title" style={{ textAlign: 'center' }}>Explore the Grid</h2>
        <p className="section-subtitle" style={{ margin: '0 auto 48px', textAlign: 'center' }}>
          Jump into any section of the CodePrix paddock.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, maxWidth: 900, margin: '0 auto' }}>
          {[
            { href: '/challenges', label: 'Challenges', icon: '🧩', desc: 'Browse the question categories' },
            { href: '/leaderboard', label: 'Leaderboard', icon: '📊', desc: 'Live standings & rankings' },
            { href: '/teams', label: 'Teams', icon: '🏎️', desc: 'See all competing teams' },
          ].map((tile) => (
            <Link key={tile.href} href={tile.href} className="panel" style={{ textDecoration: 'none', color: '#fff', textAlign: 'center' }}>
              <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: 12 }}>{tile.icon}</span>
              <h3 style={{
                fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
              }}>
                {tile.label}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{tile.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
