'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getParticipant } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getQuestionsForAttempt, flattenQuestions, saveQuestionsToStorage } from '@/lib/questions';
import AuthGuard from '@/components/AuthGuard';
import MuteButton from '@/components/MuteButton';
import { useAudio } from '@/lib/useAudio';
import LeaderboardOverlay from '@/components/LeaderboardOverlay';

interface Attempt {
  id: string;
  participant_id: string;
  event_id: number;
  status: 'pending' | 'in_progress' | 'completed';
  started_at: string | null;
  completed_at: string | null;
  is_dnf?: boolean;
}

interface EventConfig {
  id: number;
  name: string;
  is_open: boolean;
  is_active: boolean;
  results_released: boolean;
}

const QUESTIONS_PER_SECTOR = 3;

export default function DashboardPage() {
  const [participant, setParticipant] = useState<{ id: string; team_name: string } | null>(null);
  const [activeRace, setActiveRace] = useState<EventConfig | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [lightsStep, setLightsStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const router = useRouter();
  const { play, muted, toggleMute } = useAudio();

  // L key shortcut to open leaderboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') setShowLeaderboard(v => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('cp_participant');
    if (stored) {
      const parsed = JSON.parse(stored);
      setParticipant(parsed);
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchEventData = async () => {
      if (!participant) return;

      setLoading(true);

      // Fetch the active race
      const { data: activeConfigs, error: activeError } = await supabase
        .from('event_config')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      if (!activeError && activeConfigs && activeConfigs.length > 0) {
        const race = activeConfigs[0];
        setActiveRace(race);

        // Fetch participant's attempt FOR THIS SPECIFIC RACE
        const { data: attempts, error: attemptError } = await supabase
          .from('attempts')
          .select('*')
          .eq('participant_id', participant.id)
          .eq('event_id', race.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!attemptError && attempts && attempts.length > 0) {
          setAttempt(attempts[0]);
        } else {
          setAttempt(null);
        }
      } else {
        setActiveRace(null);
        setAttempt(null);
      }

      setLoading(false);
    };

    fetchEventData();

    // Subscribe to real-time event config changes for the active race
    const channel = supabase
      .channel('active_race_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_config' },
        (payload) => {
          const row = payload.new as any;
          if (row && row.is_active) {
            setActiveRace(row);
          } else if (payload.old && (payload.old as any).id === activeRace?.id) {
            // If the current active race was updated/deleted, refresh
            fetchEventData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [participant, activeRace?.id]);

  // ── Launch Sequence Animation ──────────────────────────────────────────────
  useEffect(() => {
    if (!activeRace?.is_open) {
      setLightsStep(0);
      return;
    }

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setLightsStep(step);
      if (step >= 5) clearInterval(interval);
    }, 600);

    return () => clearInterval(interval);
  }, [activeRace?.is_open]);

  // Play race complete sound
  useEffect(() => {
    if (attempt?.status === 'completed') {
      play('race_complete');
    }
  }, [attempt?.status, play]);

  const handleStartRace = async () => {
    if (!participant || !activeRace || !activeRace.is_open) {
      alert('Race has not started yet');
      return;
    }

    if (attempt && attempt.status === 'completed') {
      alert('You have already completed this race.');
      return;
    }

    if (attempt && attempt.status === 'in_progress') {
      router.push('/race');
      return;
    }

    // Generate questions
    const sectored = await getQuestionsForAttempt(QUESTIONS_PER_SECTOR);
    const flat = flattenQuestions(sectored);
    saveQuestionsToStorage(flat);

    // Create new attempt linked to THIS race
    const { data: newAttempt, error } = await supabase
      .from('attempts')
      .insert({
        participant_id: participant.id,
        event_id: activeRace.id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating attempt:', error);
      alert('Failed to start race. Please try again.');
      return;
    }

    setAttempt(newAttempt);
    router.push('/race');
  };

  const handleResumeRace = () => {
    router.push('/race');
  };

  if (loading) {
    return (
      <AuthGuard role="participant">
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
      </AuthGuard>
    );
  }

  const handleLogout = () => {
    import('@/lib/auth').then(({ logoutParticipant }) => {
      logoutParticipant();
      router.push('/login');
    });
  };

  if (!participant) return null;

  return (
    <AuthGuard role="participant">
      <main className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
        <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
          <MuteButton muted={muted} onToggle={toggleMute} />
          <button
            onClick={handleLogout}
            className="rounded-full border border-white/10 bg-black/40 px-5 py-2 font-racing text-[10px] uppercase tracking-[0.2em] text-white/50 backdrop-blur-md transition-all hover:border-white/30 hover:text-white"
          >
            Sign Out
          </button>
        </div>
        
        {/* Background video with dimmed overlay */}
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-30">
            <source src="/assets/vid.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
          <div className="w-full max-w-4xl">
            <div className="w-full rounded-[26px] border border-white/12 bg-black/75 px-6 py-9 text-center shadow-[0_28px_70px_rgba(0,0,0,0.5)] sm:px-12 sm:py-12">
              <p className="font-racing text-xs uppercase tracking-[0.36em] text-[#E10600]">DEBUGGERS' CLUB</p>
              <h1 className="mt-6 font-racing text-3xl sm:text-5xl md:text-6xl tracking-[0.06em] text-white">CODEPRIX 1.0</h1>
              {activeRace ? (
                  <div className="mt-2 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1 font-racing text-[9px] uppercase tracking-widest text-[#00c853]">
                     {activeRace.name} Is Live
                  </div>
              ) : (
                  <div className="mt-2 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1 font-racing text-[9px] uppercase tracking-widest text-white/30">
                     No Active Event
                  </div>
              )}
              
              <p className="mt-6 text-base sm:text-xl text-white/80 px-2">
                Welcome, <span className="font-semibold text-white break-all">{participant.team_name}</span>.
              </p>

              {activeRace && attempt?.status !== 'completed' && (
                  <>
                    <div className="mt-8 flex justify-center gap-3">
                        {Array.from({ length: 5 }).map((_, idx) => {
                        const isLit = activeRace.is_open && idx < (lightsStep || 0);
                        return (
                            <span
                            key={`ready-dot-${idx}`}
                            className={`h-9 w-9 rounded-full border transition-all duration-300 ${
                                isLit
                                ? idx < 2
                                    ? 'border-[#E10600]/85 bg-[#E10600]/30 shadow-[0_0_20px_rgba(225,6,0,0.5)]'
                                    : idx === 2
                                    ? 'border-[#e9b600]/85 bg-[#e9b600]/30 shadow-[0_0_20px_rgba(233,182,0,0.5)]'
                                    : 'border-[#00c853]/85 bg-[#00c853]/30 shadow-[0_0_20px_rgba(0,200,83,0.5)]'
                                : 'border-white/20 bg-[#2b2b2b]'
                            }`}
                            />
                        );
                        })}
                    </div>
                    <p className="mt-6 font-racing text-lg sm:text-2xl tracking-[0.04em] text-white/80">
                        {activeRace.is_open ? 'Ready on the grid.' : 'Awaiting Pit Entry...'}
                    </p>
                  </>
              )}


              <div className="mt-8">
                {!activeRace ? (
                    <div className="rounded-[22px] border border-white/10 bg-white/5 px-8 py-5 font-racing text-xs uppercase tracking-[0.3em] text-white/30">
                        Grid is being prepared by race control
                    </div>
                ) : attempt?.status === 'completed' ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-full rounded-[22px] border border-[#E10600]/45 bg-[#E10600]/10 px-8 py-4 font-racing text-sm sm:text-base uppercase tracking-[0.18em] text-[#E10600] text-center">
                      {attempt.is_dnf ? '🏁 DNF - Disqualified' : '🏁 Race Complete'}
                    </div>
                    {activeRace?.results_released ? (
                      <button
                        onClick={() => setShowLeaderboard(true)}
                        className="w-full rounded-[22px] border border-[#00c853]/50 bg-[#00c853]/10 px-8 py-5 font-racing text-base sm:text-lg uppercase tracking-[0.18em] text-[#00c853] hover:bg-[#00c853]/20 transition-all shadow-[0_0_20px_rgba(0,200,83,0.15)] active:scale-[0.98] flex items-center justify-center gap-3"
                      >
                        <span>📊 View Leaderboard</span>
                        <span className="rounded-lg border border-[#00c853]/30 bg-[#00c853]/10 px-2 py-0.5 text-[10px] tracking-widest opacity-60">L</span>
                      </button>
                    ) : (
                      <div className="w-full rounded-[22px] border border-white/10 bg-white/5 px-8 py-4 font-racing text-xs uppercase tracking-widest text-white/30 text-center">
                        Standings being calculated by race control...
                      </div>
                    )}
                  </div>
                ) : attempt?.status === 'in_progress' ? (
                  <button
                    onClick={handleResumeRace}
                    className="w-full rounded-[22px] border border-[#E10600]/50 bg-[#E10600] px-8 py-5 font-racing text-base sm:text-lg uppercase tracking-[0.18em] text-white transition-all hover:bg-[#ff1a0e] shadow-[0_0_20px_rgba(225,6,0,0.3)] active:scale-[0.98]"
                  >
                    RESUME RACE
                  </button>
                ) : (
                  <button
                    onClick={handleStartRace}
                    disabled={!activeRace.is_open}
                    className={`w-full rounded-[22px] px-8 py-5 font-racing text-base sm:text-lg uppercase tracking-[0.18em] transition-all duration-200 active:scale-[0.98] ${
                      !activeRace.is_open
                        ? 'border border-white/20 bg-white/20 text-white/70 cursor-not-allowed'
                        : 'border border-[#E10600]/50 bg-[#E10600] text-white hover:bg-[#ff1a0e] shadow-[0_0_20px_rgba(225,6,0,0.3)]'
                    }`}
                  >
                    {activeRace.is_open ? 'START RACE' : 'Race Not Started'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <LeaderboardOverlay isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </AuthGuard>
  );
}
