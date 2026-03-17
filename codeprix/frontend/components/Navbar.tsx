'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);

  const checkAuth = () => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
    window.addEventListener('auth-change', checkAuth);
    return () => window.removeEventListener('auth-change', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    checkAuth();
    router.push('/');
  };

  const links = [
    { href: '/', label: 'Home', show: true },
    { href: '/how-it-works', label: 'How It Works', show: true },
    { href: '/challenges', label: 'Challenges', show: true },
    { href: '/leaderboard', label: 'Leaderboard', show: true },
    { href: '/teams', label: 'Teams', show: true },
    { href: '/admin', label: 'Admin Dashboard', show: user?.role === 'admin' }
  ];

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

      <ul style={{ display: 'flex', gap: 32, listStyle: 'none', margin: 0, padding: 0, alignItems: 'center' }}>
        {links.filter(l => l.show).map(({ href, label }) => {
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
        
        {/* Auth Toggle Logic */}
        <li>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--brand-red)', fontWeight: 600 }}>
                {user.role === 'admin' ? '[ADMIN]' : ''} {user.name}
              </span>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'none', border: '1px solid var(--panel-border)', color: 'var(--text-secondary)', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--panel-border)'; }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link href="/auth" style={{
              background: 'var(--brand-red)', color: '#fff', padding: '6px 16px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600
            }}>
              Login
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
