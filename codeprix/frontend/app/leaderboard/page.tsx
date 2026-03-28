'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import {
  getLeaderboardPublic,
  getLeaderboard,
  isResultsReleased,
  LeaderboardPublicEntry,
  LeaderboardEntry,
} from '@/lib/leaderboard';
import { supabase } from '@/lib/supabase';

const podiumColors = ['#C0C0C0', '#FFD700', '#CD7F32'];
const podiumHeights = [140, 180, 110];
const medals = ['🥈', '🥇', '🥉'];

function SkeletonRow() {
  return <div className="h-12 animate-pulse rounded-[14px] bg-white/[0.04]" />;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<(LeaderboardPublicEntry | LeaderboardEntry)[]>([]);
  const [showScore, setShowScore] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    const released = await isResultsReleased();
    setShowScore(released);
    const data = released ? await getLeaderboard() : await getLeaderboardPublic();
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    // Only auto-refresh if a race is currently active to save Supabase queries
    const checkAndSetInterval = async () => {
      const { data: activeConfigs } = await supabase
        .from('event_config')
        .select('id')
        .eq('is_active', true)
        .limit(1);
        
      if (activeConfigs && activeConfigs.length > 0) {
        intervalRef.current = window.setInterval(fetchData, 3000);
      }
    };
    
    checkAndSetInterval();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toFixed(1).padStart(4, '0');
    return m > 0 ? `${m}m ${s}s` : `${seconds.toFixed(1)}s`;
  };

  const top3 = entries.slice(0, 3);

  return (
    <AuthGuard role="participant">
      <div className="carbon-bg min-h-screen" style={{ paddingTop: 84 }}>
        <section className="section">
          {/* Header */}
          <div className="racing-stripe animate-in" />
          <h1 className="section-title animate-in animate-delay-1">Leaderboard</h1>
          <p className="section-subtitle animate-in animate-delay-2">
            Rankings are based on score first, then cumulative question timer.
          </p>

          {loading ? (
            <div className="mt-8 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : (
            <>
              {/* Podium — vertical on mobile, horizontal on sm+ */}
              {top3.length >= 3 && (
                <div className="animate-in animate-delay-3 mb-10">
                  {/* Mobile: stacked list */}
                  <div className="flex flex-col gap-3 sm:hidden">
                    {[top3[0], top3[1], top3[2]].map((e, i) => (
                      <div key={e.rank} className="flex items-center gap-4 rounded-[14px] border px-4 py-3"
                        style={{ borderColor: `${podiumColors[i]}44`, background: `${podiumColors[i]}08` }}>
                        <span className="text-2xl">{medals[i]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-racing text-xs uppercase tracking-[0.1em] truncate" style={{ color: podiumColors[i] }}>{e.teamName}</p>
                          <p className="text-xs text-white/40 mt-0.5">{formatTime(e.totalTime)}</p>
                        </div>
                        <span className="font-racing text-xl font-black" style={{ color: podiumColors[i] }}>P{e.rank}</span>
                      </div>
                    ))}
                  </div>
                  {/* Desktop: podium bars */}
                  <div className="hidden sm:flex justify-center items-end gap-4">
                    {[top3[1], top3[0], top3[2]].map((e, i) => (
                      <div key={e.rank} style={{ textAlign: 'center', flex: 1, maxWidth: 200 }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, color: podiumColors[i] }}>
                          {e.teamName}
                        </div>
                        <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{medals[i]}</div>
                        {showScore && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                            {(e as LeaderboardEntry).score} pts
                          </div>
                        )}
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{formatTime(e.totalTime)}</div>
                        <div style={{
                          height: podiumHeights[i],
                          background: `linear-gradient(180deg, ${podiumColors[i]}22, ${podiumColors[i]}08)`,
                          border: `1px solid ${podiumColors[i]}44`,
                          borderRadius: '8px 8px 0 0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 900,
                          color: podiumColors[i],
                        }}>P{e.rank}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full table — horizontal scroll on mobile */}
              <div className="animate-in animate-delay-4 overflow-x-auto rounded-[12px] border border-white/10">
                <div className="min-w-[400px]">
                  <div className="grid border-b border-white/10 px-4 sm:px-6 py-3 font-racing text-[10px] sm:text-[0.65rem] uppercase tracking-[0.12em] text-white/40"
                    style={{ gridTemplateColumns: showScore ? '52px 1fr 80px 100px' : '52px 1fr 120px' }}>
                    <span>Pos</span><span>Team</span>
                    {showScore && <span className="text-right">Score</span>}
                    <span className="text-right">Time</span>
                  </div>

                  {entries.length === 0 ? (
                    <div className="px-6 py-10 text-center font-racing text-xs uppercase tracking-[0.1em] text-white/25">NO RESULTS YET</div>
                  ) : entries.map((e) => {
                    const isTop = e.rank <= 3;
                    const color = isTop ? podiumColors[e.rank - 1] : 'rgba(255,255,255,0.7)';
                    return (
                      <div
                        key={e.rank}
                        className="grid items-center border-b border-white/[0.06] px-4 sm:px-6 py-3 sm:py-3.5 transition-colors hover:bg-white/[0.03] active:bg-white/[0.03]"
                        style={{ gridTemplateColumns: showScore ? '52px 1fr 80px 100px' : '52px 1fr 120px' }}
                      >
                        <span className="font-racing" style={{ fontSize: isTop ? '1rem' : '0.8rem', fontWeight: 700, color }}>
                          {medals[e.rank - 1] ?? `P${e.rank}`}
                        </span>
                        <span className="font-racing text-xs sm:text-[0.82rem] font-semibold tracking-[0.04em] truncate pr-2">{e.teamName}</span>
                        {showScore && (
                          <span className="text-right font-racing text-xs text-white/60">{(e as LeaderboardEntry).score}</span>
                        )}
                        <span className="text-right font-racing text-xs text-white/50 tracking-[0.06em]">{formatTime(e.totalTime)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Elimination zone */}
              <div className="mt-6 flex items-start sm:items-center gap-3 rounded-[8px] border border-[#E10600]/20 bg-[#E10600]/[0.06] px-4 py-4">
                <span className="text-xl shrink-0">🚩</span>
                <p className="text-xs sm:text-[0.82rem] text-white/50">
                  <strong className="text-[#E10600]">Elimination Zone:</strong> Teams ranked P9 and below are at risk of elimination after each qualifying round.
                </p>
              </div>
            </>
          )}

          {/* Return button */}
          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-racing"
              style={{ justifyContent: 'center' }}
            >
              ← Return to Quiz
            </button>
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}
