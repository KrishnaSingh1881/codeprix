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

  // Preload penalty audio
  // Replace with actual F1 radio sound clip at public/sounds/penalty.mp3
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
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtor) return;
      const ctx = new AudioCtor();
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
    } catch {
      // Audio not available
    }
  }, []);

  const triggerPenalty = useCallback(async (triggerType: 'tab_switch' | 'window_blur') => {
    if (!isActive || !attemptId) return;

    // Debounce — ignore if a penalty fired within the last 3 seconds
    const now = Date.now();
    if (now - lastPenaltyAt.current < DEBOUNCE_MS) return;
    lastPenaltyAt.current = now;

    // 1. Notify parent to add time to the running timer
    onPenalty(PENALTY_SECONDS);

    // 2. Play penalty audio
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => playFallbackBeep());
    } else {
      playFallbackBeep();
    }

    // 3. Show notification
    onNotification(`+${PENALTY_SECONDS}s PENALTY — ${triggerType === 'tab_switch' ? 'Tab switch detected' : 'Window focus lost'}`);

    // 4. Insert penalty row into Supabase
    const { error: penaltyError } = await supabase.from('penalties').insert({
      attempt_id: attemptId,
      trigger_type: triggerType,
      penalty_seconds: PENALTY_SECONDS,
      triggered_at: new Date().toISOString(),
    });

    if (penaltyError) {
      console.error('Error inserting penalty:', penaltyError);
    }

    // 5. Increment penalty_count and penalty_seconds on the attempt row
    const { error: attemptError } = await supabase.rpc('increment_penalty', {
      p_attempt_id: attemptId,
      p_penalty_seconds: PENALTY_SECONDS,
    });

    if (attemptError) {
      // Fallback: manual update if RPC not available
      const { data: attempt } = await supabase
        .from('attempts')
        .select('penalty_count, penalty_seconds')
        .eq('id', attemptId)
        .single();

      if (attempt) {
        await supabase
          .from('attempts')
          .update({
            penalty_count: (attempt.penalty_count || 0) + 1,
            penalty_seconds: (attempt.penalty_seconds || 0) + PENALTY_SECONDS,
          })
          .eq('id', attemptId);
      }
    }
  }, [attemptId, isActive, onPenalty, onNotification, playFallbackBeep]);

  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerPenalty('tab_switch');
      }
    };

    const handleWindowBlur = () => {
      triggerPenalty('window_blur');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isActive, triggerPenalty]);
}
