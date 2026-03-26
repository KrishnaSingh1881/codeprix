'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { getParticipant } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getLeaderboardPublic, LeaderboardPublicEntry } from '@/lib/leaderboard';

interface Attempt {
  id: string;
  score: number;
  total_time_seconds: number;
  penalty_seconds: number;
  penalty_count: number;
  status: string;
}

interface EventConfig {
  id: number;
  name: string;
  results_released: boolean;
  total_questions: number;
}

const podiumColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
const medals = ['🥇', '🥈', '🥉'];

export default function ResultsPage() {
  const router = useRouter();
  const [participant, setParticipant] = useState<{ id: string; team_name: string } | null>(null);
  const [activeRace, setActiveRace] = useState<EventConfig | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPublicEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<number | null>(null);

  const fetchAll = useCallback(async (participantId: string) => {
    // 1. Get Active Race
    const { data: activeConfigs } = await supabase
      .from('event_config')
      .select('id, name, results_released')
      .eq('is_active', true)
      .limit(1);

    if (!activeConfigs || activeConfigs.length === 0) {
      setLoading(false);
      return;
    }
    const race = activeConfigs[0];
    setActiveRace({ ...race, total_questions: 30 }); // Defaulting to 30

    // 2. Fetch specific attempt for THIS race
    const { data: attempts } = await supabase
      .from('attempts')
      .select('id, score, total_time_seconds, penalty_seconds, penalty_count, status')
      .eq('participant_id', participantId)
      .eq('event_id', race.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (attempts && attempts.length > 0) {
      setAttempt(attempts[0]);
    }

    // 3. Fetch leaderboard for THIS race
    const lb = await getLeaderboardPublic(race.id);
    setLeaderboard(lb);

    // 4. Find my rank
    const myEntry = lb.find((e) => e.teamName === participant?.team_name);
    if (myEntry) setMyRank(myEntry.rank);

    setLoading(false);
  }, [participant?.team_name]);

  useEffect(() => {
    const stored = getParticipant();
    if (!stored) { router.push('/login'); return; }
    setParticipant(stored);
  }, [router]);

  useEffect(() => {
    if (!participant) return;
    fetchAll(participant.id);

    pollRef.current = window.setInterval(async () => {
      const { data: activeConfigs } = await supabase
        .from('event_config')
        .select('id, name, results_released')
        .eq('is_active', true)
        .limit(1);

      if (activeConfigs && activeConfigs.length > 0) {
        const race = activeConfigs[0];
        setActiveRace(prev => ({ ...prev, ...race, total_questions: 30 }));
        
        if (race.results_released) {
          const lb = await getLeaderboardPublic(race.id);
          setLeaderboard(lb);
          const myEntry = lb.find((e) => e.teamName === participant.team_name);
          if (myEntry) setMyRank(myEntry.rank);
        }
      }
    }, 10000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [participant, fetchAll]);

  if (loading || !participant) {
    return (
      <AuthGuard role="participant">
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="text-center">
             <div className="font-racing text-xs uppercase tracking-[0.36em] text-[#E10600]">DEBUGGERS' CLUB</div>
             <div className="mt-8 flex justify-center gap-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-3 w-3 rounded-full bg-[#E10600] animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />)}
             </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const resultsReleased = activeRace?.results_released ?? false;
  const correctAnswers = attempt ? attempt.score / 10 : 0;
  const totalTime = attempt ? attempt.total_time_seconds + attempt.penalty_seconds : 0;

  return (
    <AuthGuard role="participant">
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(40,40,40,0.35),transparent_42%),linear-gradient(180deg,#050505_0%,#080808_100%)]">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">

            <div className="text-center">
              <p className="font-racing text-xs uppercase tracking-[0.36em] text-[#E10600]">DEBUGGERS' CLUB</p>
              <h1 className="mt-4 font-racing text-5xl tracking-[0.06em] text-white sm:text-6xl">CODEPRIX 1.0</h1>
              <p className="mt-3 text-base text-white/60 tracking-wider">Race complete. Results for: {activeRace?.name || 'Active Session'}</p>
            </div>

            {!resultsReleased ? (
              <>
                <div className="mt-12 rounded-[26px] border border-white/12 bg-black/60 px-8 py-10 text-center shadow-[0_28px_70px_rgba(0,0,0,0.5)]">
                  <p className="font-racing text-[11px] uppercase tracking-[0.36em] text-white/40">Race Director</p>
                  <h2 className="mt-3 font-racing text-2xl tracking-[0.06em] text-white">RESULTS PENDING</h2>
                  <p className="mt-4 text-base text-white/55">Race Director will release final standings soon.</p>
                </div>
                <LeaderboardTable entries={leaderboard} myTeam={participant.team_name} />
              </>
            ) : (
              <>
                {attempt && (
                  <div className="mt-12 rounded-[26px] border border-[#E10600]/30 bg-[linear-gradient(135deg,#130707_0%,#111214_50%,#141414_100%)] px-8 py-10 shadow-[0_28px_70px_rgba(0,0,0,0.5)]">
                    {myRank && (
                      <div className="mb-6 flex justify-center">
                        <div className="rounded-full border px-6 py-2 font-racing text-2xl tracking-[0.1em] bg-white/5">
                           P{myRank}
                        </div>
                      </div>
                    )}
                    <h2 className="text-center font-racing text-[11px] uppercase tracking-[0.36em] text-[#E10600]">Season Point Standing</h2>
                    <p className="mt-2 text-center font-racing text-3xl tracking-[0.06em] text-white">{participant.team_name}</p>
                    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <StatCard label="Laps" value={String(correctAnswers)} accent />
                      <StatCard label="Finish Time" value={formatDuration(totalTime * 1000)} />
                      <StatCard label="Penalties" value={`+${attempt.penalty_seconds}s`} color="#E10600" />
                    </div>
                  </div>
                )}
                <LeaderboardTable entries={leaderboard} myTeam={participant.team_name} />
              </>
            )}

            <div className="mt-10 text-center">
              <button onClick={() => router.push('/dashboard')} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 font-racing text-xs uppercase tracking-[0.28em] text-white/60 hover:text-white transition-all">
                ← Back to Grid
              </button>
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}

function StatCard({ label, value, accent, color }: { label: string; value: string; accent?: boolean; color?: string }) {
  return (
    <div className={`rounded-[18px] border px-5 py-4 ${accent ? 'border-[#E10600]/35 bg-[#E10600]/[0.07]' : 'border-white/10 bg-white/[0.03]'}`}>
      <p className="font-racing text-[10px] uppercase tracking-[0.34em] text-white/40">{label}</p>
      <p className="mt-2 font-racing text-xl tracking-[0.06em]" style={{ color: color ?? (accent ? '#E10600' : '#fff') }}>{value}</p>
    </div>
  );
}

function LeaderboardTable({ entries, myTeam }: { entries: LeaderboardPublicEntry[]; myTeam: string }) {
  return (
    <div className="mt-10 overflow-hidden rounded-[18px] border border-white/10 bg-black/40">
        <div className="grid border-b border-white/10 px-5 py-3 font-racing text-[9px] uppercase tracking-[0.28em] text-white/30" style={{ gridTemplateColumns: '52px 1fr 120px' }}>
          <span>Rank</span><span>Competitor</span><span className="text-right">Interval</span>
        </div>
        {entries.map((e) => {
          const isMe = e.teamName === myTeam;
          return (
            <div key={e.rank} className={`grid items-center border-b border-white/[0.04] px-5 py-3.5 ${isMe ? 'bg-[#E10600]/10' : 'hover:bg-white/[0.02]'}`} style={{ gridTemplateColumns: '52px 1fr 120px' }}>
              <span className="font-racing text-xs text-white/40">P{e.rank}</span>
              <span className={`font-racing text-[13px] tracking-tight ${isMe ? 'text-[#E10600]' : 'text-white'}`}>{e.teamName}{isMe ? ' ★' : ''}</span>
              <span className="text-right font-racing text-xs text-white/30">{formatDuration(e.totalTime * 1000)}</span>
            </div>
          );
        })}
    </div>
  );
}

function formatDuration(ms: number) {
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  const remS = Math.floor(s % 60);
  const tenth = Math.floor((ms % 1000) / 100);
  return `${String(m).padStart(2,'0')}:${String(remS).padStart(2,'0')}.${tenth}`;
}
