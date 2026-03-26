'use client';

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const PENALTY_SECONDS = 30;
const DEBOUNCE_MS = 3000;

interface UsePenaltyOptions {
  attemptId: string | null;
  onPenalty: (seconds: number) => void;
  onNotification: (message: string) => void;
  isActive: boolean;
}

export function usePenalty({ attemptId, onPenalty, onNotification, isActive }: UsePenaltyOptions) {
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
    console.log(`[PenaltySystem] Trigger attempt: ${triggerType} | active=${isActive} | attemptId=${attemptId}`);
    
    if (!isActive || !attemptId) return;

    const now = Date.now();
    const timeSinceLast = now - lastPenaltyAt.current;
    
    if (timeSinceLast < DEBOUNCE_MS) {
      console.log(`[PenaltySystem] Debounced: ${timeSinceLast}ms < ${DEBOUNCE_MS}ms`);
      return;
    }
    
    lastPenaltyAt.current = now;
    console.log(`[PenaltySystem] APPLYING PENALTY: ${triggerType}`);

    // 1. Notify parent to add time
    onPenalty(PENALTY_SECONDS);

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
    onNotification(`+${PENALTY_SECONDS}s PENALTY — ${triggerType === 'tab_switch' ? 'Tab switch detected' : 'Window focus lost'}`);

    // 4. Update DB (async, non-blocking for UI)
    try {
      const { error: pError } = await supabase.from('penalties').insert({
        attempt_id: attemptId,
        trigger_type: triggerType,
        penalty_seconds: PENALTY_SECONDS,
        triggered_at: new Date().toISOString(),
      });
      if (pError) throw pError;

      const { error: rpcError } = await supabase.rpc('increment_penalty', {
        p_attempt_id: attemptId,
        p_penalty_seconds: PENALTY_SECONDS,
      });
      if (rpcError) throw rpcError;
    } catch (err) {
      console.error('[PenaltySystem] DB Update Error:', err);
      // Fallback manual update
      try {
        const { data: attempt } = await supabase.from('attempts').select('penalty_count, penalty_seconds').eq('id', attemptId).single();
        if (attempt) {
          await supabase.from('attempts').update({
            penalty_count: (attempt.penalty_count || 0) + 1,
            penalty_seconds: (attempt.penalty_seconds || 0) + PENALTY_SECONDS,
          }).eq('id', attemptId);
        }
      } catch (f) {
        console.error('[PenaltySystem] Manual fallback also failed:', f);
      }
    }
  }, [attemptId, isActive, onPenalty, onNotification, playFallbackBeep]);

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
