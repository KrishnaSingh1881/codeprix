'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getParticipant, isAdmin, logoutParticipant, logoutAdmin } from '@/lib/auth';
import { useAudio } from '@/lib/useAudio';
import MuteButton from '@/components/MuteButton';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [participant, setParticipant] = useState<{ id: string; team_name: string } | null>(null);
  const [admin, setAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { muted, toggleMute } = useAudio();

  const checkAuth = () => {
    const storedParticipant = getParticipant();
    setParticipant(storedParticipant ?? null);
    setAdmin(isAdmin());
  };

  useEffect(() => {
    checkAuth();
    window.addEventListener('auth-change', checkAuth);
    return () => window.removeEventListener('auth-change', checkAuth);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleLogout = () => {
    if (participant) logoutParticipant();
    if (admin) logoutAdmin();
    checkAuth();
    router.push('/');
  };

  // Hide global navbar ONLY on administrative or focused race pages
  const isActionPage = pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/race') || pathname?.startsWith('/results');
  if (isActionPage) return null;

  const links = [
    { href: '/', label: 'Home', show: true },
    { href: '/how-it-works', label: 'How It Works', show: true },
    { href: '/challenges', label: 'Challenges', show: true },
    { href: '/leaderboard', label: 'Leaderboard', show: true },
    { href: '/teams', label: 'Teams', show: true },
    { href: '/admin/dashboard', label: 'Admin', show: admin },
  ].filter(l => l.show);

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-5 sm:px-10 h-16 bg-black/75 backdrop-blur-[16px] border-b border-white/[0.07]">
        <Link href="/" className="font-racing text-base sm:text-lg font-extrabold tracking-[0.18em] uppercase text-white no-underline">
          <span className="text-[#E10600]">Code</span>Prix
        </Link>
        <MuteButton muted={muted} onToggle={toggleMute} />

        {/* Desktop nav */}
        <ul className="hidden md:flex gap-6 lg:gap-8 list-none m-0 p-0 items-center">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="font-racing text-[11px] tracking-[0.1em] uppercase no-underline transition-colors duration-200 pb-1"
                  style={{
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                    borderBottom: active ? '2px solid #E10600' : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) (e.target as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={e => { if (!active) (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            {participant || admin ? (
              <div className="flex items-center gap-4">
                <span className="text-[0.75rem] text-[#E10600] font-semibold">
                  {admin ? '[ADMIN]' : ''} {participant?.team_name || 'Admin'}
                </span>
                <button
                  onClick={handleLogout}
                  className="border border-white/15 text-white/50 px-4 py-1.5 rounded text-[0.7rem] uppercase tracking-[0.05em] hover:text-white hover:border-white/30 transition-colors bg-transparent cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/login" className="bg-[#E10600] text-white px-4 py-1.5 rounded text-[0.75rem] uppercase tracking-[0.05em] font-semibold no-underline hover:bg-[#ff1a0e] transition-colors">
                Login
              </Link>
            )}
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="md:hidden flex flex-col gap-[5px] p-2 cursor-pointer bg-transparent border-none"
          aria-label="Toggle menu"
        >
          <span className={`block h-[2px] w-6 bg-white transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <span className={`block h-[2px] w-6 bg-white transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-[2px] w-6 bg-white transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10 md:hidden"
          >
            <div className="flex flex-col px-5 py-4 gap-1">
              {links.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`font-racing text-sm uppercase tracking-[0.14em] py-3 px-3 rounded-[10px] no-underline transition-colors ${active ? 'bg-[#E10600]/15 text-[#E10600]' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'}`}
                  >
                    {label}
                  </Link>
                );
              })}
              <div className="mt-3 pt-3 border-t border-white/10">
                {participant || admin ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#E10600] font-semibold">
                      {participant?.team_name || 'Admin'}
                    </span>
                    <button onClick={handleLogout} className="text-white/50 text-sm border border-white/15 px-4 py-2 rounded-[8px] bg-transparent cursor-pointer hover:text-white transition-colors">
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="block w-full text-center bg-[#E10600] text-white py-3 rounded-[12px] font-racing text-sm uppercase tracking-[0.14em] no-underline">
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
