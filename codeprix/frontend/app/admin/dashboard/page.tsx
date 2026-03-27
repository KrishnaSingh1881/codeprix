'use client';

import { useEffect, useRef, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AdminSidebar from '@/components/AdminSidebar';
import { supabase } from '@/lib/supabase';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import LeaderboardOverlay from '@/components/LeaderboardOverlay';

interface EventConfig {
  id: number;
  name: string;
  is_open: boolean;
  results_released: boolean;
  is_active: boolean;
}

interface ParticipantRow {
  id: string;
  team_name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  current_sector: number | null;
  attempt_id: string | null;
}

interface AnswerDetail {
  question_id: number;
  question_body: string;
  selected_option: string;
  is_correct: boolean;
  sector: string;
}

interface ParticipantDetail {
  team_name: string;
  score: number;
  total_time_seconds: number;
  penalty_seconds: number;
  answers: AnswerDetail[];
}

const statusColor: Record<string, string> = {
  not_started: 'rgba(255,255,255,0.35)',
  in_progress: '#e9b300',
  completed: '#00c853',
};
const statusLabel: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function AdminDashboardPage() {
  const [view, setView] = useState<'race_list' | 'race_manager'>('race_list');
  const [races, setRaces]             = useState<EventConfig[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [detail, setDetail]           = useState<ParticipantDetail | null>(null);
  const [detailOpen, setDetailOpen]   = useState(false);
  const [loading, setLoading]         = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRaceName, setNewRaceName] = useState('');
  const [confirmProps, setConfirmProps] = useState<{
    open: boolean; title: string; desc: string;
    onConfirm: () => void; type: 'danger' | 'info';
  }>({ open: false, title: '', desc: '', onConfirm: () => {}, type: 'info' });
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'error' | 'success' | null }>({ message: '', type: null });
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Track ongoing updates so toggling can't interleave
  const updating = useRef(false);

  const notify = (message: string, type: 'error' | 'success') => setToastMsg({ message, type });

  // Derive selected race from the races array — no extra state
  const selectedRace = races.find(r => r.id === selectedRaceId) ?? null;

  // ── Pure fetch helpers (no stale-closure risk) ──────────────────────────
  const loadRaces = async () => {
    const { data, error } = await supabase.from('event_config').select('*').order('id', { ascending: false });
    if (error) notify('DB Error: ' + error.message, 'error');
    else setRaces(data ?? []);
    setLoading(false);
  };

  const loadParticipants = async (raceId: number) => {
    const { data: parts } = await supabase.from('participants').select('id, team_name');
    const { data: attempts } = await supabase
      .from('attempts')
      .select('id, participant_id, status, current_question_index')
      .eq('event_id', raceId)
      .order('id', { ascending: false });

    const attemptMap = new Map<string, any>();
    (attempts ?? []).forEach((a: any) => {
      if (!attemptMap.has(a.participant_id)) attemptMap.set(a.participant_id, a);
    });

    const rows: ParticipantRow[] = (parts ?? []).map((p: any) => {
      const a = attemptMap.get(p.id);
      const sector = a?.current_question_index != null
        ? Math.floor(a.current_question_index / 3) + 1
        : null;
      return { id: p.id, team_name: p.team_name, status: a?.status ?? 'not_started', current_sector: sector, attempt_id: a?.id ?? null };
    });
    setParticipants(rows);
  };

  // ── Polling ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadRaces();
    const id = setInterval(() => {
      if (view === 'race_list') loadRaces();
      if (view === 'race_manager' && selectedRaceId) loadParticipants(selectedRaceId);
    }, 3000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedRaceId]);

  // ── Race List Actions ────────────────────────────────────────────────────
  const handleCreateRace = async () => {
    if (!newRaceName.trim()) return;
    const { data, error } = await supabase
      .from('event_config')
      .insert([{ name: newRaceName, is_open: false, results_released: false, is_active: false }])
      .select().single();
    if (error) notify('Error: ' + error.message, 'error');
    else {
      setRaces(prev => [data, ...prev]);
      setCreateModalOpen(false);
      setNewRaceName('');
      notify('Session Created', 'success');
    }
  };

  const handleDeleteRace = (id: number) => {
    const race = races.find(r => r.id === id);
    setConfirmProps({
      open: true, type: 'danger',
      title: 'DELETE RACE?',
      desc: `This permanently deletes "${race?.name}" and all its attempt data. This cannot be undone.`,
      onConfirm: async () => {
        // Delete cascade: attempts → event_config
        const { error: attemptsErr } = await supabase.from('attempts').delete().eq('event_id', id);
        if (attemptsErr && !attemptsErr.message.includes('0 rows')) {
          notify('Attempts delete blocked. Add RLS delete policy — see README.', 'error');
          setConfirmProps(p => ({ ...p, open: false }));
          return;
        }
        const { error } = await supabase.from('event_config').delete().eq('id', id);
        if (error) {
          notify(
            error.message.includes('row-level') || error.message.includes('policy')
              ? 'RLS policy missing. Run: CREATE POLICY "event_config delete" ON event_config FOR DELETE USING (true);'
              : error.message,
            'error'
          );
        } else {
          setRaces(prev => prev.filter(r => r.id !== id));
          notify('Race Deleted', 'success');
          if (selectedRaceId === id) { setSelectedRaceId(null); setView('race_list'); }
        }
        setConfirmProps(p => ({ ...p, open: false }));
      }
    });
  };

  // ── Race Manager Actions ─────────────────────────────────────────────────
  const setRaceField = async (field: 'is_open' | 'results_released' | 'is_active', value: boolean) => {
    if (!selectedRace || updating.current) return;
    updating.current = true;
    // Optimistic UI update
    setRaces(prev => prev.map(r => r.id === selectedRace.id ? { ...r, [field]: value } : r));
    const { error } = await supabase.from('event_config').update({ [field]: value }).eq('id', selectedRace.id);
    if (error) {
      notify(error.message, 'error');
      // Revert on failure
      setRaces(prev => prev.map(r => r.id === selectedRace.id ? { ...r, [field]: !value } : r));
    }
    updating.current = false;
  };

  const startRace = () => {
    setConfirmProps({
      open: true, type: 'info', title: 'START RACE?',
      desc: `This will RESET ALL PROGRESS and open the pit lane for "${selectedRace?.name}". All existing attempts will be deleted.`,
      onConfirm: async () => {
        updating.current = true;
        // 1. Reset progress (delete all attempts for this race)
        await supabase.from('attempts').delete().eq('event_id', selectedRace!.id);
        
        // 2. Deactivate all other races
        await supabase.from('event_config').update({ is_active: false, is_open: false }).neq('id', selectedRace!.id);
        
        // 3. Activate & open this race
        const { error } = await supabase.from('event_config').update({ is_active: true, is_open: true }).eq('id', selectedRace!.id);
        if (error) notify(error.message, 'error');

        else {
          setRaces(prev => prev.map(r => r.id === selectedRace!.id
            ? { ...r, is_active: true, is_open: true }
            : { ...r, is_active: false, is_open: false }
          ));
          notify('Race Started — Pit Lane Open', 'success');
        }
        updating.current = false;
        setConfirmProps(p => ({ ...p, open: false }));
      }
    });
  };

  const endRace = () => {
    setConfirmProps({
      open: true, type: 'danger', title: 'END RACE?',
      desc: `This will close the pit lane for "${selectedRace?.name}". Participants can no longer submit attempts.`,
      onConfirm: async () => {
        const { error } = await supabase.from('event_config').update({ is_open: false }).eq('id', selectedRace!.id);
        if (error) notify(error.message, 'error');
        else {
          setRaces(prev => prev.map(r => r.id === selectedRace!.id ? { ...r, is_open: false } : r));
          notify('Race Closed — Pit Lane Locked', 'success');
        }
        setConfirmProps(p => ({ ...p, open: false }));
      }
    });
  };

  const openDetail = async (row: ParticipantRow) => {
    if (!row.attempt_id) return;
    const { data: attempt } = await supabase.from('attempts').select('*').eq('id', row.attempt_id).single();
    const { data: answers } = await supabase.from('answers').select('*').eq('attempt_id', row.attempt_id);
    const qIds = (answers ?? []).map((a: any) => a.question_id);
    const { data: questions } = await supabase.from('questions').select('id, body').in('id', qIds);
    const qMap = new Map((questions ?? []).map((q: any) => [q.id, q.body]));
    setDetail({
      team_name: row.team_name,
      score: attempt?.score ?? 0,
      total_time_seconds: attempt?.total_time_seconds ?? 0,
      penalty_seconds: attempt?.penalty_seconds ?? 0,
      answers: (answers ?? []).map((a: any) => ({ ...a, question_body: qMap.get(a.question_id) ?? `Q${a.question_id}` })),
    });
    setDetailOpen(true);
  };

  const navigateToManager = (race: EventConfig) => {
    setSelectedRaceId(race.id);
    setView('race_manager');
    loadParticipants(race.id);
  };

  return (
    <>
    <AuthGuard role="admin">
      <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-racing">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 pt-20 md:pt-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl tracking-wide uppercase">Race Control</h1>
              <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-white/40">Global Paddock — Mission Command</p>
            </div>
            {view === 'race_manager' && (
              <button onClick={() => setView('race_list')} className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                ← Back to Grid
              </button>
            )}
          </div>

          {/* ── RACE LIST VIEW ── */}
          {view === 'race_list' && (
            <div className="space-y-8">
              <section className="flex items-center justify-between rounded-[32px] border border-white/10 bg-white/[0.03] p-8">
                <div>
                  <h2 className="text-xl tracking-tighter uppercase mb-1">Race Sessions</h2>
                  <p className="text-[11px] text-white/40 uppercase tracking-[0.22em]">
                    {loading ? 'Scanning grid...' : `${races.length} session${races.length !== 1 ? 's' : ''} configured`}
                  </p>
                </div>
                <button onClick={() => setCreateModalOpen(true)} className="rounded-2xl bg-[#E10600] px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#ff1a0e] shadow-[0_0_20px_rgba(225,6,0,0.3)] transition-all">
                  + New Race
                </button>
              </section>

              {/* Loading skeleton */}
              {loading && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-56 rounded-[24px] border border-white/5 bg-white/[0.02] animate-pulse" />)}
                </div>
              )}

              {/* Empty state */}
              {!loading && races.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="text-6xl mb-6 opacity-20">🏁</div>
                  <p className="text-xl uppercase tracking-widest font-black text-white/20">No Races Configured</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-white/10">Create your first race session to get started</p>
                  <button onClick={() => setCreateModalOpen(true)} className="mt-8 rounded-2xl border border-white/10 px-8 py-4 text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">
                    + Create Race
                  </button>
                </div>
              )}

              {/* Race cards */}
              {!loading && races.length > 0 && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                  {races.map(race => (
                    <div key={race.id} className={`relative flex flex-col justify-between rounded-[24px] border p-7 transition-all ${race.is_active ? 'border-[#00c853]/40 bg-[#00c853]/[0.04]' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}>
                      {race.is_active && (
                        <div className="absolute top-0 right-0 rounded-bl-xl rounded-tr-[20px] bg-[#00c853] px-3 py-1 text-[8px] font-black uppercase tracking-widest text-black">
                          ● LIVE
                        </div>
                      )}
                      <div>
                        <p className="text-[8px] uppercase tracking-[0.3em] text-white/30 mb-1">Session #{race.id}</p>
                        <h3 className="text-2xl uppercase tracking-tighter mb-4 pr-16">{race.name}</h3>
                        <div className="flex gap-2 flex-wrap">
                          <span className={`rounded-lg border px-2 py-1 text-[8px] uppercase tracking-widest font-bold ${race.is_open ? 'border-[#00c853]/60 text-[#00c853]' : 'border-white/15 text-white/25'}`}>
                            {race.is_open ? 'Pit Open' : 'Pit Closed'}
                          </span>
                          <span className={`rounded-lg border px-2 py-1 text-[8px] uppercase tracking-widest font-bold ${race.results_released ? 'border-blue-500/60 text-blue-400' : 'border-white/15 text-white/25'}`}>
                            {race.results_released ? 'Results Live' : 'Results Hidden'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-6 flex gap-2">
                        <button
                          onClick={() => navigateToManager(race)}
                          className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-[9px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => handleDeleteRace(race.id)}
                          className="rounded-xl border border-red-500/10 bg-transparent px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-red-500/40 hover:bg-red-500/10 hover:text-red-500 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── RACE MANAGER VIEW ── */}
          {view === 'race_manager' && selectedRace && (
            <div className="space-y-8">
              {/* Control panel */}
              <section className="rounded-[32px] border border-white/10 bg-[#0a0a0a] p-8">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-[#E10600] mb-2">Managing Session</p>
                    <h2 className="text-4xl uppercase tracking-tighter">{selectedRace.name}</h2>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest ${selectedRace.is_active ? 'bg-[#00c853]/20 text-[#00c853]' : 'bg-white/5 text-white/30'}`}>
                        {selectedRace.is_active ? '● Active Circuit' : '○ Inactive'}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest ${selectedRace.is_open ? 'bg-[#00c853]/20 text-[#00c853]' : 'bg-red-500/10 text-red-400'}`}>
                        {selectedRace.is_open ? 'Pit Lane Open' : 'Pit Lane Closed'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRace(selectedRace.id)}
                    className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/15 transition-all"
                  >
                    Delete Race
                  </button>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Start Race */}
                  <button
                    onClick={startRace}
                    disabled={selectedRace.is_open}
                    className={`flex items-center justify-center gap-3 rounded-2xl border py-6 transition-all ${selectedRace.is_open ? 'border-white/5 bg-white/[0.02] text-white/20 cursor-not-allowed' : 'border-[#00c853]/40 bg-[#00c853]/10 text-[#00c853] hover:bg-[#00c853]/20'}`}
                  >
                    <span className="text-2xl">🟢</span>
                    <div className="text-left">
                      <p className="text-[9px] uppercase tracking-widest opacity-50">Action</p>
                      <p className="text-sm font-black uppercase tracking-tighter">{selectedRace.is_open ? 'Race Running' : 'Start Race'}</p>
                    </div>
                  </button>

                  {/* End Race */}
                  <button
                    onClick={endRace}
                    disabled={!selectedRace.is_open}
                    className={`flex items-center justify-center gap-3 rounded-2xl border py-6 transition-all ${!selectedRace.is_open ? 'border-white/5 bg-white/[0.02] text-white/20 cursor-not-allowed' : 'border-[#E10600]/40 bg-[#E10600]/10 text-[#E10600] hover:bg-[#E10600]/20'}`}
                  >
                    <span className="text-2xl">🏁</span>
                    <div className="text-left">
                      <p className="text-[9px] uppercase tracking-widest opacity-50">Action</p>
                      <p className="text-sm font-black uppercase tracking-tighter">{!selectedRace.is_open ? 'Race Ended' : 'End Race'}</p>
                    </div>
                  </button>

                  {/* Release / Hide Results */}
                  <button
                    onClick={() => setRaceField('results_released', !selectedRace.results_released)}
                    className={`flex items-center justify-center gap-3 rounded-2xl border py-6 transition-all ${selectedRace.results_released ? 'border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'}`}
                  >
                    <span className="text-2xl">{selectedRace.results_released ? '📊' : '🔒'}</span>
                    <div className="text-left">
                      <p className="text-[9px] uppercase tracking-widest opacity-50">Standings</p>
                      <p className="text-sm font-black uppercase tracking-tighter">{selectedRace.results_released ? 'Results Live' : 'Release Results'}</p>
                    </div>
                  </button>
                </div>
              </section>

              {/* Participant table */}
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#080808]">
                <div className="flex items-center justify-between border-b border-white/10 px-8 py-5">
                  <div className="grid flex-1 text-[9px] uppercase tracking-[0.3em] text-white/30" style={{ gridTemplateColumns: '1fr 180px 100px' }}>
                    <span>Competitor</span><span>Status</span><span className="text-right">Sector</span>
                  </div>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {participants.length === 0 ? (
                    <div className="py-16 text-center text-white/20 text-[10px] uppercase tracking-widest">No participants on grid</div>
                  ) : participants.map(p => (
                    <div
                      key={p.id}
                      onClick={() => openDetail(p)}
                      className={`grid items-center px-8 py-5 transition-all ${p.attempt_id ? 'cursor-pointer hover:bg-white/[0.03]' : 'cursor-default opacity-50'}`}
                      style={{ gridTemplateColumns: '1fr 180px 100px' }}
                    >
                      <span className="text-sm font-black tracking-tighter uppercase">{p.team_name}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: statusColor[p.status] }}>{statusLabel[p.status]}</span>
                      <span className="text-right text-[10px] font-bold text-white/30">{p.current_sector ? `S${p.current_sector}` : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── Modals & Overlays ────────────────────────────────────────────── */}
        <Toast message={toastMsg.message} type={toastMsg.type} onClose={() => setToastMsg(t => ({ ...t, type: null }))} />
        <ConfirmModal
          isOpen={confirmProps.open}
          onClose={() => setConfirmProps(p => ({ ...p, open: false }))}
          onConfirm={confirmProps.onConfirm}
          title={confirmProps.title}
          desc={confirmProps.desc}
          type={confirmProps.type}
        />

        {/* Create race modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" onClick={() => setCreateModalOpen(false)} />
            <div className="relative w-full max-w-md rounded-[36px] border border-white/15 bg-[#0d0d0d] p-10 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-1.5 w-12 rounded-full bg-[#E10600]" />
                <h3 className="text-xl uppercase tracking-tighter">New Race Session</h3>
              </div>
              <label className="mb-2 block text-[10px] uppercase tracking-widest text-white/40">Race Name</label>
              <input
                autoFocus
                type="text"
                value={newRaceName}
                onChange={e => setNewRaceName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateRace()}
                placeholder="e.g. Grand Prix Finals"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold focus:border-[#E10600] focus:outline-none transition-all placeholder:text-white/15"
              />
              <div className="flex gap-3 mt-8">
                <button onClick={() => setCreateModalOpen(false)} className="flex-1 rounded-xl border border-white/10 py-4 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-all">Cancel</button>
                <button onClick={handleCreateRace} className="flex-1 rounded-xl bg-[#E10600] py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">Create</button>
              </div>
            </div>
          </div>
        )}

        {/* Participant detail panel */}
        {detailOpen && detail && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setDetailOpen(false)} />
            <div className="relative z-10 w-full max-w-lg bg-[#080808] border-l border-white/10 p-8 shadow-2xl overflow-y-auto">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.4em] text-[#E10600]">Technical Brief</p>
                  <h3 className="text-3xl uppercase tracking-tighter mt-1">{detail.team_name}</h3>
                </div>
                <button onClick={() => setDetailOpen(false)} className="rounded-full border border-white/10 px-5 py-2 text-[9px] uppercase tracking-widest text-white/35 hover:text-white transition-all">Close</button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5"><p className="text-[8px] uppercase tracking-[0.3em] text-white/30">Time</p><p className="text-2xl mt-1 font-bold">{detail.total_time_seconds}s</p></div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-[#E10600]"><p className="text-[8px] uppercase tracking-[0.3em] opacity-40">Penalty</p><p className="text-2xl mt-1 font-bold">+{detail.penalty_seconds}s</p></div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-blue-400"><p className="text-[8px] uppercase tracking-[0.3em] opacity-40">Score</p><p className="text-2xl mt-1 font-bold">{detail.score}</p></div>
              </div>
              <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-[0.4em] text-white/25">Answer Log</p>
                {detail.answers.length === 0 && <p className="text-white/20 text-sm py-4 text-center">No answers recorded</p>}
                {detail.answers.map((a, i) => (
                  <div key={i} className={`rounded-2xl border p-5 ${a.is_correct ? 'border-emerald-500/10 bg-emerald-500/5' : 'border-[#E10600]/10 bg-[#E10600]/5'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-white/85 font-sans leading-relaxed">{a.question_body}</p>
                      <span className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-[9px] font-black ${a.is_correct ? 'bg-emerald-500 text-black' : 'bg-[#E10600] text-white'}`}>{a.is_correct ? 'PASS' : 'FAIL'}</span>
                    </div>
                    <p className="mt-3 text-[9px] uppercase tracking-widest text-white/20">Answered: {a.selected_option}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
    <LeaderboardOverlay isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} isAdmin={true} />
    </>
  );
}
