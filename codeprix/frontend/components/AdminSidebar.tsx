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
            className={`flex items-center gap-4 rounded-[16px] px-4 py-3.5 md:py-2.5 font-racing text-[13px] md:text-[11px] uppercase tracking-[0.18em] transition-all ${
              active
                ? 'bg-[#E10600]/15 text-[#E10600] border-l-4 border-[#E10600]'
                : 'text-white/50 hover:bg-white/[0.04] hover:text-white active:bg-white/[0.06]'
            }`}
          >
            <span className="text-xl md:text-base">{icon}</span>
            {label}
          </Link>
        );
      })}
      <button
        onClick={handleSignOut}
        className="flex w-full items-center gap-4 rounded-[16px] px-4 py-3.5 md:py-2.5 font-racing text-[13px] md:text-[11px] uppercase tracking-[0.18em] text-white/40 transition-all hover:bg-white/[0.04] hover:text-white"
      >
        <span className="text-xl md:text-base">🚪</span>
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-[60] flex items-center justify-between border-b border-white/10 bg-[#0a0a0a] px-4 py-3 shadow-lg">
        <div>
          <p className="font-racing text-[10px] uppercase tracking-[0.36em] text-[#E10600]">CODEPRIX</p>
          <p className="font-racing text-[9px] uppercase tracking-[0.2em] text-white/30">Admin Panel</p>
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

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-0 z-[55] bg-[#0a0a0a] pt-20 px-6 flex flex-col gap-2"
          >
            <div className="mb-6">
               <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 mb-4 px-3">Navigation Menu</p>
               <NavLinks />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
