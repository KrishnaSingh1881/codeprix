'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  // Hide footer on focused action pages that have their own full-screen layouts
  const isActionPage =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/race') ||
    pathname?.startsWith('/results') ||
    pathname?.startsWith('/login');

  if (isActionPage) return null;

  return (
    <footer className="footer">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8, color: 'rgba(255,255,255,0.4)' }}>
          CodePrix &mdash; Where Code Meets Speed
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          &copy; {new Date().getFullYear()} CodePrix. All rights reserved. Not affiliated with Formula 1.
        </p>
      </div>
    </footer>
  );
}
