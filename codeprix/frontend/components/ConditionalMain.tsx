'use client';

import { usePathname } from 'next/navigation';
import PageTransition from '@/components/PageTransition';

const ACTION_PATHS = ['/admin', '/dashboard', '/race', '/results', '/login'];

export default function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActionPage = ACTION_PATHS.some((p) => pathname?.startsWith(p));

  // On action pages, render children directly — no <main> wrapper, no page transition
  // This prevents stacking context conflicts with full-screen layouts
  if (isActionPage) {
    return <>{children}</>;
  }

  return (
    <main>
      <PageTransition>{children}</PageTransition>
    </main>
  );
}
