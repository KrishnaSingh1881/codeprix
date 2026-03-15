'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/challenges', label: 'Challenges' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/teams', label: 'Teams' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 40px', height: 64,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <Link href="/" style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 18, fontWeight: 800, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: '#fff', textDecoration: 'none',
      }}>
        <span style={{ color: 'var(--brand-red)' }}>Code</span>Prix
      </Link>

      <ul style={{ display: 'flex', gap: 32, listStyle: 'none', margin: 0, padding: 0 }}>
        {links.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <li key={href}>
              <Link href={href} style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                textDecoration: 'none',
                transition: 'color 0.2s',
                borderBottom: isActive ? '2px solid var(--brand-red)' : '2px solid transparent',
                paddingBottom: 4,
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
