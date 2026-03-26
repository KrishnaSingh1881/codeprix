'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { logoutAdmin } from '@/lib/auth';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '⬛' },
  { href: '/admin/questions', label: 'Questions', icon: '❓' },
  { href: '/admin/participants', label: 'Participants', icon: '🏎️' },
  { href: '/admin/leaderboard', label: 'Leaderboard', icon: '📊' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    logoutAdmin();
    router.push('/admin/login');
  };

  const NavLinks = () => (
    <>
      {links.map(({ href, label, icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 font-racing text-[11px] uppercase tracking-[0.18em] transition-colors ${
              active
                ? 'bg-[#E10600]/15 text-[#E10600]'
                : 'text-white/50 hover:bg-white/[0.04] hover:text-white active:bg-white/[0.06]'
            }`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </Link>
        );
      })}
      <button
        onClick={handleSignOut}
        className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 font-racing text-[11px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white"
      >
        <span className="text-base">🚪</span>
        Sign Out
      </button>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen w-56 shrink-0 flex-col border-r border-white/10 bg-[#0a0a0a]">
        <div className="border-b border-white/10 px-5 py-6">
          <p className="font-racing text-[10px] uppercase tracking-[0.36em] text-[#E10600]">DEBUGGERS' CLUB</p>
          <p className="mt-1 font-racing text-lg tracking-[0.06em] text-white">CODEPRIX</p>
          <p className="mt-0.5 font-racing text-[10px] uppercase tracking-[0.28em] text-white/30">Admin Panel</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          <NavLinks />
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a]/95 px-4 py-3 backdrop-blur-sm">
        <div>
          <p className="font-racing text-[10px] uppercase tracking-[0.3em] text-[#E10600]">CODEPRIX</p>
          <p className="font-racing text-[9px] uppercase tracking-[0.2em] text-white/30">Admin</p>
        </div>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="flex flex-col gap-[5px] p-2 bg-transparent border-none cursor-pointer"
          aria-label="Toggle admin menu"
        >
          <span className={`block h-[2px] w-5 bg-white transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <span className={`block h-[2px] w-5 bg-white transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-[2px] w-5 bg-white transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden fixed top-[52px] left-0 right-0 z-40 bg-[#0a0a0a]/98 border-b border-white/10 px-3 py-3 flex flex-col gap-1"
          >
            <NavLinks />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
