'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getParticipant, isAdmin } from '@/lib/auth';

type AuthGuardProps = {
  role: 'participant' | 'admin';
  children: React.ReactNode;
};

export default function AuthGuard({ role, children }: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (role === 'participant') {
      const participant = getParticipant();
      if (participant) {
        setIsAuthenticated(true);
      } else {
        router.push('/login');
      }
    } else if (role === 'admin') {
      if (isAdmin()) {
        setIsAuthenticated(true);
      } else {
        router.push('/admin/login');
      }
    }
    setIsChecking(false);
  }, [role, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="font-racing text-6xl tracking-[0.06em] text-white mb-4">CODEPRIX</div>
          <div className="font-racing text-sm uppercase tracking-[0.36em] text-[#E10600]">DEBUGGERS' CLUB</div>
          <div className="mt-8 flex justify-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#E10600] animate-pulse" />
            <div className="h-3 w-3 rounded-full bg-[#E10600] animate-pulse animation-delay-100" />
            <div className="h-3 w-3 rounded-full bg-[#E10600] animate-pulse animation-delay-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
