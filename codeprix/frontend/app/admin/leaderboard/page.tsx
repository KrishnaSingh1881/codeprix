'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AdminSidebar from '@/components/AdminSidebar';
import { getLeaderboardAdmin, LeaderboardAdminEntry, resetLeaderboard } from '@/lib/leaderboard';
import { supabase } from '@/lib/supabase';
import ConfirmModal from '@/components/ConfirmModal';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1).padStart(4, '0');
  return m > 0 ? `${m}m ${s}s` : `${seconds.toFixed(1)}s`;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const podiumColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function AdminLeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardAdminEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    const data = await getLeaderboardAdmin();
    setEntries(data);
    setLastUpdated(new Date());
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
        setIsRefreshing(true);
        intervalRef.current = window.setInterval(fetchData, 3000);
      } else {
        setIsRefreshing(false);
      }
    };
    
    checkAndSetInterval();
    
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  const handleReset = async () => {
    setResetLoading(true);
    const success = await resetLeaderboard();
    if (success) {
      await fetchData();
      setShowResetModal(false);
    }
    setResetLoading(false);
  };

  return (
    <AuthGuard role="admin">
      <div className="flex h-screen bg-[#050505] text-white overflow-hidden">
        <AdminSidebar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 pt-20 md:pt-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-racing text-3xl tracking-[0.06em] text-white">Leaderboard</h1>
              <div className="flex items-center gap-3">
                <p className="font-racing text-[11px] uppercase tracking-[0.28em] text-white/40">Full admin view — all data visible</p>
                <button
                  onClick={() => setShowResetModal(true)}
                  disabled={entries.length === 0}
                  className="rounded-md bg-red-500/10 px-2 py-0.5 font-racing text-[9px] uppercase tracking-widest text-red-500 transition-all hover:bg-red-500 hover:text-white disabled:opacity-0"
                >
                  Reset Leaderboard
                </button>
                <button
                  onClick={() => {
                    const headers = ["Rank", "Team Name", "Score", "Total Time (s)", "Penalty Count", "Penalty Seconds", "Submitted At"];
                    const rows = entries.map(e => [
                      e.rank,
                      e.teamName,
                      e.score,
                      e.totalTime,
                      e.penaltyCount,
                      e.penaltySeconds,
                      e.completedAt || 'In Progress'
                    ]);
                    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
                    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `codeprix_results_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  disabled={entries.length === 0}
                  className="rounded-md bg-green-500/10 px-2 py-0.5 font-racing text-[9px] uppercase tracking-widest text-green-500 transition-all hover:bg-green-500 hover:text-white disabled:opacity-0"
                >
                  Export CSV
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="font-racing text-[10px] uppercase tracking-[0.28em] text-white/25">
                {isRefreshing ? 'Auto-refresh every 3s' : 'Auto-refresh inactive'}
              </p>
              {lastUpdated && (
                <p className="mt-0.5 font-racing text-[10px] uppercase tracking-[0.2em] text-white/35">
                  Last: {formatDate(lastUpdated.toISOString())}
                </p>
              )}
            </div>
          </div>

          {/* Summary strip */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { label: 'Total Finished', value: entries.length },
              { label: 'Top Score', value: entries[0]?.score ?? '—' },
              { label: 'Fastest Time', value: entries.length ? formatTime(Math.min(...entries.map(e => e.totalTime))) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-[18px] border border-white/10 bg-white/[0.03] px-5 py-4">
                <p className="font-racing text-[10px] uppercase tracking-[0.34em] text-white/40">{label}</p>
                <p className="mt-2 font-racing text-2xl text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="mt-6 overflow-hidden rounded-[18px] border border-white/10">
            {/* Header */}
            <div
              className="grid border-b border-white/10 px-5 py-3 font-racing text-[10px] uppercase tracking-[0.28em] text-white/40"
              style={{ gridTemplateColumns: '52px 1fr 80px 120px 100px 100px' }}
            >
              <span>Pos</span>
              <span>Team</span>
              <span className="text-right">Score</span>
              <span className="text-right">Total Time</span>
              <span className="text-right">Penalties</span>
              <span className="text-right">Submitted</span>
            </div>

            {loading ? (
              <div className="space-y-px">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse bg-white/[0.03]" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="px-5 py-12 text-center font-racing text-[11px] uppercase tracking-[0.2em] text-white/25">
                No completed attempts yet
              </div>
            ) : entries.map((e) => {
              const isTop3 = e.rank <= 3;
              const rankColor = isTop3 ? podiumColors[e.rank - 1] : 'rgba(255,255,255,0.55)';
              const rankLabel = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : `P${e.rank}`;

              return (
                <div
                  key={e.participantId}
                  className="grid items-center border-b border-white/[0.06] px-5 py-3.5 transition-colors hover:bg-white/[0.03]"
                  style={{ gridTemplateColumns: '52px 1fr 80px 120px 100px 100px' }}
                >
                  <span
                    className="font-racing"
                    style={{ fontSize: isTop3 ? '1.1rem' : '0.8rem', color: rankColor }}
                  >
                    {rankLabel}
                  </span>

                  <span className="font-racing text-xs tracking-[0.06em] text-white">
                    {e.teamName}
                  </span>

                  <span
                    className="text-right font-racing text-sm"
                    style={{ color: isTop3 ? rankColor : 'rgba(255,255,255,0.8)' }}
                  >
                    {e.score}
                  </span>

                  <span className="text-right font-racing text-xs tracking-[0.06em] text-white/60">
                    {formatTime(e.totalTime)}
                  </span>

                  <span className="text-right font-racing text-xs">
                    {e.penaltyCount > 0 ? (
                      <span className="text-[#E10600]">
                        {e.penaltyCount}× (+{e.penaltySeconds}s)
                      </span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </span>

                  <span className="text-right font-racing text-[10px] text-white/35">
                    {formatDate(e.completedAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </main>

        <ConfirmModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          onConfirm={handleReset}
          title="RESET LEADERBOARD"
          desc="This will PERMANENTLY delete all recorded attempts and scores for the current event. This action cannot be undone."
          type="danger"
          confirmText={resetLoading ? "RESETTING..." : "CONFIRM RESET"}
          cancelText="CANCEL"
        />
      </div>
    </AuthGuard>
  );
}
