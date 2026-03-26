'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Sound manifest ───────────────────────────────────────────────────────────
// Replace each file in /public/sounds/ with the real F1 audio clip.
export type SoundName =
  | 'countdown'       // F1 start-light tick (one beep per light)
  | 'launch'          // F1 lights-out / go sound
  | 'sector_complete' // Short radio crackle / sector bell
  | 'penalty'         // F1 radio static burst + penalty tone
  | 'leaderboard_open'// Radio crackle on leaderboard open
  | 'race_complete';  // Chequered flag / finish fanfare

const SOUND_SRCS: Record<SoundName, string> = {
  countdown:        '/assets/audio/f1-start-light.mp3', // reuse existing asset
  launch:           '/assets/audio/f1-lights-out.mp3',  // reuse existing asset
  sector_complete:  '/sounds/sector_complete.mp3',
  penalty:          '/sounds/penalty.mp3',
  leaderboard_open: '/sounds/Leaderboard.mp3',
  race_complete:    '/sounds/race_complete.mp3',
};

const SOUND_VOLUMES: Record<SoundName, number> = {
  countdown:        0.85,
  launch:           0.9,
  sector_complete:  0.7,
  penalty:          0.8,
  leaderboard_open: 0.6,
  race_complete:    0.9,
};

// ─── Web Audio fallback beeps ─────────────────────────────────────────────────
type BeepConfig = { frequency: number; duration: number; gain: number; type?: OscillatorType };

const FALLBACK_BEEPS: Record<SoundName, BeepConfig> = {
  countdown:        { frequency: 760,  duration: 0.09, gain: 0.018, type: 'square' },
  launch:           { frequency: 1100, duration: 0.16, gain: 0.028, type: 'square' },
  sector_complete:  { frequency: 880,  duration: 0.12, gain: 0.02,  type: 'sine'   },
  penalty:          { frequency: 220,  duration: 0.35, gain: 0.15,  type: 'sawtooth'},
  leaderboard_open: { frequency: 600,  duration: 0.12, gain: 0.015, type: 'sine'   },
  race_complete:    { frequency: 1320, duration: 0.4,  gain: 0.03,  type: 'sine'   },
};

// ─── Mute preference persisted to localStorage ────────────────────────────────
const MUTE_KEY = 'cp_audio_muted';

export function useAudio() {
  const audioMap = useRef<Map<SoundName, HTMLAudioElement>>(new Map());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const interactedRef = useRef(false);
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(MUTE_KEY) === 'true';
  });

  // ── Unlock audio context on first interaction ─────────────────────────────
  const unlock = useCallback(() => {
    if (interactedRef.current) return;
    interactedRef.current = true;

    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtor && !audioCtxRef.current) {
      audioCtxRef.current = new AudioCtor();
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, []);

  // ── Preload all audio files ───────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    (Object.entries(SOUND_SRCS) as [SoundName, string][]).forEach(([name, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = SOUND_VOLUMES[name];
      audioMap.current.set(name, audio);
    });

    // Register global interaction unlock
    const onInteract = () => unlock();
    window.addEventListener('pointerdown', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });

    return () => {
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
      audioMap.current.forEach((a) => a.pause());
      audioMap.current.clear();
    };
  }, [unlock]);

  // ── Fallback beep via Web Audio ───────────────────────────────────────────
  const playFallback = useCallback((name: SoundName) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const { frequency, duration, gain, type = 'square' } = FALLBACK_BEEPS[name];
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    amp.gain.setValueAtTime(0.0001, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.03);
  }, []);

  // ── Main play function ────────────────────────────────────────────────────
  const play = useCallback((name: SoundName) => {
    if (muted || !interactedRef.current) return;

    const audio = audioMap.current.get(name);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => playFallback(name));
    } else {
      playFallback(name);
    }
  }, [muted, playFallback]);

  // ── Mute toggle ───────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem(MUTE_KEY, String(next));
      return next;
    });
  }, []);

  return { play, unlock, muted, toggleMute };
}
