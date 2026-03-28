'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getLeaderboardPublic, getLeaderboard, isResultsReleased, LeaderboardPublicEntry, LeaderboardEntry } from '@/lib/leaderboard';
import { useAudio } from '@/lib/useAudio';
import { supabase } from '@/lib/supabase';

interface LeaderboardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean; // Show clear button only for admin
}

const podiumColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
const medals = ['🥇', '🥈', '🥉'];

export default function LeaderboardOverlay({ isOpen, onClose, isAdmin = false }: LeaderboardOverlayProps) {
  const [entries, setEntries]       = useState<(LeaderboardPublicEntry | LeaderboardEntry)[]>([]);
  const [showScore, setShowScore]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [raceName, setRaceName]     = useState<string>('');
  const [clearing, setClearing]     = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const overlayRef  = useRef<HTMLDivElement>(null);
  const { play } = useAudio();

  const fetchData = useCallback(async () => {
    // Fetch active race name
    const { data: cfg } = await supabase
      .from('event_config')
      .select('id, name, results_released, is_active')
      .eq('is_active', true)
      .limit(1);

    const activeCfg = cfg?.[0];
    if (activeCfg?.name) setRaceName(activeCfg.name);

    const released = activeCfg?.results_released ?? false;
    setShowScore(released);

    const data = released ? await getLeaderboard() : await getLeaderboardPublic();
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    play('leaderboard_open');
    fetchData();

    // Realtime: re-fetch when any attempt row changes (INSERT/UPDATE)
    const channel = supabase
      .channel('leaderboard_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attempts' },
        () => { fetchData(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'event_config' },
        () => { fetchData(); }
      )
      .subscribe();

    // Fallback poll every 3s in case a Realtime event is missed
    intervalRef.current = window.setInterval(fetchData, 3000);

    return () => {
      supabase.removeChannel(channel);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, fetchData, play]);

  const handleClearLeaderboard = async () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    setClearing(true);
    // Get active race ID
    const { data: cfg } = await supabase.from('event_config').select('id').eq('is_active', true).limit(1);
    const raceId = cfg?.[0]?.id;
    if (raceId) {
      await supabase.from('answers').delete().in(
        'attempt_id',
        (await supabase.from('attempts').select('id').eq('event_id', raceId)).data?.map((a: any) => a.id) ?? []
      );
      await supabase.from('attempts').delete().eq('event_id', raceId);
    }
    setEntries([]);
    setClearing(false);
    setClearConfirm(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toFixed(1).padStart(4, '0');
    return m > 0 ? `${m}m ${s}s` : `${seconds.toFixed(1)}s`;
  };

  const top3 = entries.slice(0, 3);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="lb-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex justify-end"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            ref={overlayRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.32, 0, 0.67, 0] }}
            className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto bg-[#0a0a0a] shadow-[-20px_0_80px_rgba(0,0,0,0.8)]"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0a]/95 px-6 py-5 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-racing text-[9px] uppercase tracking-[0.4em] text-[#E10600]">
                    CODEPRIX // RACE CONTROL
                  </p>
                  <h2 className="mt-1 font-racing text-2xl tracking-wide text-white uppercase">
                    Leaderboard
                  </h2>
                  {raceName && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#00c853]/30 bg-[#00c853]/10 px-3 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00c853] animate-pulse" />
                      <span className="font-racing text-[9px] uppercase tracking-widest text-[#00c853]">{raceName}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="mt-1 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 font-racing text-[9px] uppercase tracking-widest text-white/50 hover:border-white/30 hover:text-white transition-all"
                >
                  [L] Close
                </button>
              </div>

              {/* Admin clear button */}
              {isAdmin && (
                <div className="mt-4">
                  <button
                    onClick={handleClearLeaderboard}
                    disabled={clearing}
                    className={`w-full rounded-xl border py-2.5 font-racing text-[9px] uppercase tracking-widest transition-all ${
                      clearConfirm
                        ? 'border-red-500/60 bg-red-500/15 text-red-400 hover:bg-red-500/25'
                        : 'border-white/10 bg-white/[0.03] text-white/30 hover:border-red-500/30 hover:text-red-400/60'
                    } disabled:opacity-40`}
                  >
                    {clearing ? '⏳ Clearing...' : clearConfirm ? '⚠ Confirm — Clear All Race Data?' : '🗑 Clear Leaderboard'}
                  </button>
                  {clearConfirm && (
                    <button
                      onClick={() => setClearConfirm(false)}
                      className="mt-2 w-full rounded-xl border border-white/10 py-2 font-racing text-[8px] uppercase tracking-widest text-white/20 hover:text-white/40 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 px-6 py-6 space-y-6">
              <p className="font-racing text-[10px] uppercase tracking-[0.28em] text-white/30">
                {showScore ? 'Ranked by score · tie-break by best time' : 'Ranked by completion time'}
              </p>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="h-12 animate-pulse rounded-[14px] bg-white/[0.04]"
                    />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="text-5xl mb-4 opacity-20">🏁</div>
                  <p className="font-racing text-sm uppercase tracking-widest text-white/20">No finishers yet</p>
                  <p className="font-racing text-[9px] uppercase tracking-widest text-white/10 mt-1">Leaderboard updates every 3s</p>
                </div>
              ) : (
                <>
                  {/* Podium — show when 3+ finishers and results released */}
                  {showScore && top3.length >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-end justify-center gap-2 pt-4"
                    >
                      {/* P2 — P1 — P3 order for visual podium */}
                      {[top3[1], top3[0], top3[2]].map((e, i) => {
                        const heights = [110, 150, 80];
                        const colorIdx = [1, 0, 2];
                        const col = podiumColors[colorIdx[i]];
                        return (
                          <div key={e.rank} className="flex flex-1 flex-col items-center">
                            <p className="font-racing text-[9px] uppercase tracking-wide text-white/60 text-center leading-tight mb-1">{e.teamName}</p>
                            <p className="text-xl mb-1">{medals[colorIdx[i]]}</p>
                            <div
                              className="flex w-full items-center justify-center rounded-t-xl border"
                              style={{
                                height: heights[i],
                                background: `linear-gradient(180deg, ${col}20, ${col}06)`,
                                borderColor: `${col}50`,
                                color: col,
                              }}
                            >
                              <span className="font-racing text-2xl">P{e.rank}</span>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* Full table */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="overflow-hidden rounded-[18px] border border-white/10"
                  >
                    <div
                      className="grid border-b border-white/10 px-4 py-3 font-racing text-[9px] uppercase tracking-[0.28em] text-white/30"
                      style={{ gridTemplateColumns: showScore ? '44px 1fr 60px 60px 80px' : '1fr 60px 100px' }}
                    >
                      {showScore && <span>Pos</span>}
                      <span>Team</span>
                      {showScore && <span className="text-right">Score</span>}
                      <span className="text-right">Pen</span>
                      <span className="text-right">Time</span>
                    </div>

                    {entries.map((e, i) => {
                      const isTop3 = e.rank <= 3;
                      const color = isTop3 ? podiumColors[e.rank - 1] : 'rgba(255,255,255,0.65)';
                      const penaltyCount = (e as any).penaltyCount ?? 0;

                      return (
                        <motion.div
                          key={e.rank}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.04 }}
                          className={`grid items-center border-b border-white/[0.05] px-4 py-3.5 transition-colors hover:bg-white/[0.03] ${isTop3 && showScore ? 'bg-white/[0.02]' : ''}`}
                          style={{ gridTemplateColumns: showScore ? '44px 1fr 60px 60px 80px' : '1fr 60px 100px' }}
                        >
                          {showScore && (
                            <span className="font-racing text-base" style={{ color }}>
                              {medals[e.rank - 1] ?? `P${e.rank}`}
                            </span>
                          )}
                          <span className="font-racing text-xs tracking-wide text-white">{e.teamName}</span>
                          {showScore && (
                            <span className="text-right font-racing text-xs text-white/60">
                              {(e as LeaderboardEntry).score ?? '—'}
                            </span>
                          )}
                          <span className="text-right font-racing text-xs text-red-500/80">
                            {penaltyCount > 0 ? `+${penaltyCount}` : '0'}
                          </span>
                          <span className="text-right font-racing text-[10px] tracking-wide text-white/50">
                            { (e as any).isDnf ? (
                              <span className="text-red-500 font-bold">DNF</span>
                            ) : formatTime(e.totalTime)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Admin CSV Export */}
                  {isAdmin && entries.length > 0 && (
                    <div className="pt-4 pb-8">
                       <button
                         onClick={() => {
                           const headers = showScore ? ["Rank", "Team", "Score", "Penalties", "Total Time"] : ["Team", "Penalties", "Total Time"];
                           const rows = entries.map(e => {
                             const p = (e as any).penaltyCount ?? 0;
                             const t = formatTime(e.totalTime);
                             return showScore 
                               ? [e.rank, e.teamName, (e as any).score, p, t]
                               : [e.teamName, p, t];
                           });
                           const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
                           const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                           const url = URL.createObjectURL(blob);
                           const link = document.createElement("a");
                           link.setAttribute("href", url);
                           link.setAttribute("download", `codeprix_leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
                           document.body.appendChild(link);
                           link.click();
                           document.body.removeChild(link);
                         }}
                         className="w-full rounded-xl border border-[#00c853]/30 bg-[#00c853]/10 py-3 font-racing text-[10px] uppercase tracking-widest text-[#00c853] hover:bg-[#00c853]/20 transition-all"
                       >
                         📥 Export Leaderboard to .CSV
                       </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
