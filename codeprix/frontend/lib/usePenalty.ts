'use client';

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const PENALTY_SECONDS = 30;
const DEBOUNCE_MS = 3000;

interface UsePenaltyOptions {
  attemptId: string | null;
  currentPenaltyCount: number;
  onPenalty: (seconds: number, isDnf: boolean) => void;
  onNotification: (message: string, seconds: number | 'DNF') => void;
  isActive: boolean;
}

export function usePenalty({ attemptId, currentPenaltyCount, onPenalty, onNotification, isActive }: UsePenaltyOptions) {
  const lastPenaltyAt = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackCtxRef = useRef<AudioContext | null>(null);

  // Preload penalty audio
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio('/sounds/penalty.mp3');
    audio.preload = 'auto';
    audio.volume = 0.8;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const playFallbackBeep = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtor) return;
      
      if (!fallbackCtxRef.current) {
        fallbackCtxRef.current = new AudioCtor();
      }
      const ctx = fallbackCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Penalty fallback audio failed:', e);
    }
  }, []);

  const triggerPenalty = useCallback(async (triggerType: 'tab_switch' | 'window_blur') => {
    console.log(`[PenaltySystem] Trigger attempt: ${triggerType} | active=${isActive} | attemptId=${attemptId} | count=${currentPenaltyCount}`);
    
    if (!isActive || !attemptId) return;

    const now = Date.now();
    const timeSinceLast = now - lastPenaltyAt.current;
    
    if (timeSinceLast < DEBOUNCE_MS) {
      console.log(`[PenaltySystem] Debounced: ${timeSinceLast}ms < ${DEBOUNCE_MS}ms`);
      return;
    }
    
    lastPenaltyAt.current = now;
    
    const nextPenaltyIdx = currentPenaltyCount; // 0-indexed count
    let penaltySeconds = 0;
    let isDnf = false;

    if (nextPenaltyIdx === 0) {
      penaltySeconds = 33;
    } else if (nextPenaltyIdx === 1) {
      penaltySeconds = 44;
    } else {
      isDnf = true;
    }

    console.log(`[PenaltySystem] APPLYING PENALTY: ${triggerType} | amount=${isDnf ? 'DNF' : penaltySeconds + 's'}`);

    // 1. Notify parent to add time/DNF
    onPenalty(isDnf ? 0 : penaltySeconds, isDnf);

    // 2. Play audio
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn('Penalty audio play failed:', err);
        playFallbackBeep();
      });
    } else {
      playFallbackBeep();
    }

    // 3. Notification
    const penaltyLabel = isDnf ? 'DNF' : `+${penaltySeconds}s`;
    onNotification(
      `${penaltyLabel} PENALTY — ${triggerType === 'tab_switch' ? 'Tab switch detected' : 'Window focus lost'}`, 
      isDnf ? 'DNF' : penaltySeconds
    );

    // 4. Update DB (async, non-blocking for UI)
    try {
      const { error: pError } = await supabase.from('penalties').insert({
        attempt_id: attemptId,
        trigger_type: triggerType,
        penalty_seconds: isDnf ? 0 : penaltySeconds,
        is_dnf: isDnf,
        triggered_at: new Date().toISOString(),
      });
      if (pError) throw pError;

      const { error: rpcError } = await supabase.rpc('increment_penalty_v2', {
        p_attempt_id: attemptId,
        p_penalty_seconds: isDnf ? 0 : penaltySeconds,
        p_is_dnf: isDnf
      });
      
      // If RPC v2 fails (maybe doesn't exist yet), fallback to manual update
      if (rpcError) {
        console.warn('[PenaltySystem] increment_penalty_v2 failed, falling back to manual update:', rpcError);
        const { data: attempt } = await supabase.from('attempts').select('penalty_count, penalty_seconds, is_dnf').eq('id', attemptId).single();
        if (attempt) {
          await supabase.from('attempts').update({
            penalty_count: (attempt.penalty_count || 0) + 1,
            penalty_seconds: (attempt.penalty_seconds || 0) + (isDnf ? 0 : penaltySeconds),
            is_dnf: isDnf || attempt.is_dnf,
          }).eq('id', attemptId);
        }
      }
    } catch (err) {
      console.error('[PenaltySystem] DB Update Error:', err);
    }
  }, [attemptId, isActive, currentPenaltyCount, onPenalty, onNotification, playFallbackBeep]);

  useEffect(() => {
    if (!isActive) {
      console.log('[PenaltySystem] Not active, omitting listeners');
      return;
    }

    console.log('[PenaltySystem] Activating listeners');

    const handleVisibilityChange = () => {
      console.log(`[PenaltySystem] visibilitychange: ${document.visibilityState}`);
      if (document.visibilityState === 'hidden') {
        triggerPenalty('tab_switch');
      }
    };

    const handleWindowBlur = () => {
      console.log('[PenaltySystem] window blur');
      triggerPenalty('window_blur');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      console.log('[PenaltySystem] Deactivating listeners');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isActive, triggerPenalty]);
}
