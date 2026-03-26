import { supabase } from './supabase';

// Participant auth helpers
const PARTICIPANT_KEY = 'cp_participant';
const ADMIN_KEY = 'cp_admin';

export interface Participant {
  id: string;
  team_name: string;
}

export async function loginParticipant(teamName: string, accessCode: string): Promise<{ success: boolean; participant?: Participant }> {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('id, team_name')
      .eq('team_name', teamName)
      .eq('access_code', accessCode)
      .single();

    if (error || !data) {
      console.error('Login error:', error);
      return { success: false };
    }

    const participant: Participant = {
      id: data.id,
      team_name: data.team_name,
    };
    localStorage.setItem(PARTICIPANT_KEY, JSON.stringify(participant));
    return { success: true, participant };
  } catch (err) {
    console.error('Auth error:', err);
    return { success: false };
  }
}

export function logoutParticipant(): void {
  localStorage.removeItem(PARTICIPANT_KEY);
}

export function getParticipant(): Participant | null {
  const stored = localStorage.getItem(PARTICIPANT_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Admin auth helpers
export function loginAdmin(password: string): boolean {
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  if (password === adminPassword) {
    localStorage.setItem(ADMIN_KEY, 'true');
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  localStorage.removeItem(ADMIN_KEY);
}

export function isAdmin(): boolean {
  return localStorage.getItem(ADMIN_KEY) === 'true';
}
