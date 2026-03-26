import { supabase } from './supabase';

// ─── Formatting utils (used by QuizRaceControl) ───────────────────────────────

export type ResultEntry = {
  team: string;
  score: number;
  total: number;
  timeSpent: number;
  timeSpentMs?: number;
  overallTimeSpent?: number;
  overallTimeSpentMs?: number;
  questionTimes?: number[];
  questionTimesMs?: number[];
  submittedAt: string;
};

export const formatDuration = (milliseconds: number) => {
  const safeMilliseconds = Math.max(0, milliseconds);
  const totalTenths = Math.round(safeMilliseconds / 100);
  const minutes = Math.floor(totalTenths / 600);
  const seconds = ((totalTenths % 600) / 10).toFixed(1).padStart(4, '0');
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${(totalTenths / 10).toFixed(1)}s`;
};

export const formatTimerClock = (milliseconds: number) => {
  const safeMilliseconds = Math.max(0, milliseconds);
  const totalTenths = Math.round(safeMilliseconds / 100);
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
};

// ─── Supabase leaderboard types ───────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  teamName: string;
  score: number;
  totalTime: number; // seconds
  penaltyCount: number;
  isDnf?: boolean;
}

export interface LeaderboardPublicEntry {
  rank: number;
  teamName: string;
  totalTime: number; // seconds
  isDnf?: boolean;
}

export interface LeaderboardAdminEntry extends LeaderboardEntry {
  participantId: string;
  completedAt: string | null;
  penaltySeconds: number;
  isDnf: boolean;
}

// ─── Shared fetch + sort ──────────────────────────────────────────────────────

async function fetchRawAttempts(eventId?: number) {
  let targetEventId = eventId;

  // If no eventId provided, try to find the active one
  if (!targetEventId) {
    const { data: activeConfigs } = await supabase
      .from('event_config')
      .select('id')
      .eq('is_active', true)
      .limit(1);
    
    if (activeConfigs && activeConfigs.length > 0) {
      targetEventId = activeConfigs[0].id;
    }
  }

  // If still no eventId found (no active race), return empty
  if (!targetEventId) return [];

  const { data, error } = await supabase
    .from('attempts')
    .select(`
      id,
      score,
      total_time_seconds,
      penalty_seconds,
      penalty_count,
      completed_at,
      participant_id,
      is_dnf,
      participants ( team_name )
    `)
    .eq('event_id', targetEventId)
    .in('status', ['in_progress', 'completed']);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return (data ?? [])
    .map((row: any) => ({
      participantId: row.participant_id as string,
      teamName: (row.participants?.team_name ?? 'Unknown') as string,
      score: (row.score ?? 0) as number,
      totalTime: ((row.total_time_seconds ?? 0) + (row.penalty_seconds ?? 0)) as number,
      penaltyCount: (row.penalty_count ?? 0) as number,
      penaltySeconds: (row.penalty_seconds ?? 0) as number,
      completedAt: row.completed_at as string | null,
      isDnf: (row.is_dnf || row.penalty_count >= 3) as boolean,
    }))
    .sort((a, b) => {
      // 0. DNF Check (DNF always at bottom)
      if (a.isDnf && !b.isDnf) return 1;
      if (!a.isDnf && b.isDnf) return -1;

      // Primary: Score
      if (b.score !== a.score) return b.score - a.score;
      // Secondary: Time (Total + Penalty)
      return a.totalTime - b.totalTime;
    })
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

// ─── Public functions ─────────────────────────────────────────────────────────

/** Score hidden — used during active event */
export async function getLeaderboardPublic(eventId?: number): Promise<LeaderboardPublicEntry[]> {
  const raw = await fetchRawAttempts(eventId);
  return raw.map(({ rank, teamName, totalTime, isDnf }) => ({ rank, teamName, totalTime, isDnf }));
}

/** Score visible — used after results_released = true */
export async function getLeaderboard(eventId?: number): Promise<LeaderboardEntry[]> {
  const raw = await fetchRawAttempts(eventId);
  return raw.map(({ rank, teamName, score, totalTime, penaltyCount }) => ({
    rank, teamName, score, totalTime, penaltyCount, isDnf: raw.find(r => r.rank === rank)?.isDnf
  }));
}

/** Full data — admin panel only */
export async function getLeaderboardAdmin(eventId?: number): Promise<LeaderboardAdminEntry[]> {
  return fetchRawAttempts(eventId);
}

/** Check if results have been released for the ACTIVE race */
export async function isResultsReleased(): Promise<boolean> {
  const { data } = await supabase
    .from('event_config')
    .select('results_released')
    .eq('is_active', true)
    .limit(1);
  
  if (data && data.length > 0) return data[0].results_released;
  return false;
}

/** Reset all attempts for the active event (DANGER) */
export async function resetLeaderboard(eventId?: number): Promise<boolean> {
  let targetEventId = eventId;

  if (!targetEventId) {
    const { data: activeConfigs } = await supabase
      .from('event_config')
      .select('id')
      .eq('is_active', true)
      .limit(1);
    
    if (activeConfigs && activeConfigs.length > 0) {
      targetEventId = activeConfigs[0].id;
    }
  }

  if (!targetEventId) return false;

  const { error } = await supabase
    .from('attempts')
    .delete()
    .eq('event_id', targetEventId);

  if (error) {
    console.error('Error resetting leaderboard:', error);
    return false;
  }

  return true;
}

