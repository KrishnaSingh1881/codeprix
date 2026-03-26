'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/auth';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAdmin()) {
      router.push('/admin/dashboard');
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center font-racing text-white/30 uppercase tracking-[0.3em]">
        Redirecting to Command Center...
      </div>
    </div>
  );
}
