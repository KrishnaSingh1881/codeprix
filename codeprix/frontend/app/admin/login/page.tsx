'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sequenceStep, setSequenceStep] = useState(-1);
  const [sequenceRunning, setSequenceRunning] = useState(false);
  const sequenceIntervalRef = useRef<number | null>(null);

  const startLaunchSequence = useCallback(() => {
    if (sequenceRunning) return;

    setSequenceRunning(true);
    setSequenceStep(0);

    let step = 0;
    sequenceIntervalRef.current = window.setInterval(() => {
      step += 1;
      if (step < 5) {
        setSequenceStep(step);
        return;
      }

      if (sequenceIntervalRef.current) {
        window.clearInterval(sequenceIntervalRef.current);
        sequenceIntervalRef.current = null;
      }
      setSequenceStep(-1);
      setSequenceRunning(false);
    }, 620);
  }, [sequenceRunning]);

  useEffect(() => {
    return () => {
      if (sequenceIntervalRef.current) {
        window.clearInterval(sequenceIntervalRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    startLaunchSequence();

    // Wait for sequence to complete (5 steps * 620ms) before checking credentials
    await new Promise((resolve) => {
      setTimeout(resolve, 620 * 5 + 100);
    });

    const success = loginAdmin(password);
    
    if (success) {
      window.dispatchEvent(new Event('auth-change'));
      router.push('/admin/dashboard');
    } else {
      setError('Invalid admin password');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      {/* Background video with dimmed overlay */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-30"
        >
          <source src="/assets/vid.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <div className="w-full max-w-4xl">
          <div className="w-full rounded-[26px] border border-white/12 bg-black/75 px-6 py-9 text-center shadow-[0_28px_70px_rgba(0,0,0,0.5)] sm:px-12 sm:py-12">
            <p className="font-racing text-xs uppercase tracking-[0.36em] text-[#E10600]">DEBUGGERS' CLUB</p>
            <h1 className="mt-8 font-racing text-4xl tracking-[0.06em] text-white sm:text-6xl">CODEPRIX 1.0</h1>
            <p className="mt-6 text-base text-white/70">Code. Debug. Race to Victory.</p>

            <p className="mt-8 text-2xl text-white/80">
              Welcome, <span className="font-semibold text-white">Admin</span>. Enter your credentials to access the pit wall.
            </p>

            <div className="mt-8 flex justify-center gap-3">
              {Array.from({ length: 5 }).map((_, idx) => {
                const lit = sequenceStep >= idx && sequenceStep >= 0;
                return (
                  <span
                    key={`ready-dot-${idx}`}
                    className={`h-9 w-9 rounded-full border transition-all duration-300 ${
                      lit 
                        ? idx < 2 
                          ? 'border-[#E10600]/85 bg-[#E10600]/30 shadow-[0_0_20px_rgba(225,6,0,0.5)]' // RED
                          : idx === 2
                            ? 'border-[#e9b600]/85 bg-[#e9b600]/30 shadow-[0_0_20px_rgba(233,182,0,0.5)]' // YELLOW
                            : 'border-[#00c853]/85 bg-[#00c853]/30 shadow-[0_0_20px_rgba(0,200,83,0.5)]'   // GREEN
                        : 'border-white/20 bg-[#2b2b2b]'
                    }`}
                  />
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div className="text-left">
                <label className="block font-racing text-[11px] uppercase tracking-[0.34em] text-white/50 mb-3">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter admin password"
                  className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-5 py-4 text-white placeholder-white/30 focus:border-[#E10600]/60 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-[#E10600]/40 transition-all duration-200"
                />
              </div>

              {error && (
                <p className="text-[#E10600] font-racing text-sm uppercase tracking-[0.18em]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || sequenceRunning}
                className="w-full rounded-[22px] border border-[#E10600]/45 bg-[#E10600] px-8 py-5 font-racing text-lg uppercase tracking-[0.18em] transition-all duration-200 hover:bg-[#ff1a0e] hover:border-[#ff1a0e]/60 hover:shadow-[0_0_30px_rgba(225,6,0,0.5)] disabled:cursor-not-allowed disabled:border-white/20 disabled:bg-white/20 disabled:text-white/70 disabled:shadow-none"
              >
                {sequenceRunning ? 'Unlocking...' : 'UNLOCK PIT WALL'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
