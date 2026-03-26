'use client';

import { useCallback, useEffect, useRef } from 'react';

type LaunchAudioOptions = {
  tickSrc?: string;
  goSrc?: string;
  tickVolume?: number;
  goVolume?: number;
  tickFallbackFrequency?: number;
  tickFallbackDuration?: number;
  tickFallbackGain?: number;
  goFallbackFrequency?: number;
  goFallbackDuration?: number;
  goFallbackGain?: number;
};

export const useLaunchAudio = ({
  tickSrc = '/assets/audio/f1-start-light.mp3',
  goSrc = '/assets/audio/f1-lights-out.mp3',
  tickVolume = 0.85,
  goVolume = 0.9,
  tickFallbackFrequency = 760,
  tickFallbackDuration = 0.09,
  tickFallbackGain = 0.018,
  goFallbackFrequency = 1100,
  goFallbackDuration = 0.16,
  goFallbackGain = 0.028,
}: LaunchAudioOptions = {}) => {
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  const goAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const unlockAudio = useCallback(() => {
    if (typeof window === 'undefined') return;

    const AudioCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtor) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtor();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  }, []);

  const playFallbackBeep = useCallback((frequency: number, duration: number, gain: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const amp = ctx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    amp.gain.setValueAtTime(0.0001, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.connect(amp);
    amp.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration + 0.03);
  }, []);

  const playAudio = useCallback(
    (audio: HTMLAudioElement | null, fallbackFrequency: number, fallbackDuration: number, fallbackGain: number) => {
      if (!audio) {
        playFallbackBeep(fallbackFrequency, fallbackDuration, fallbackGain);
        return;
      }

      audio.currentTime = 0;
      const promise = audio.play();
      if (promise) {
        promise.catch(() => playFallbackBeep(fallbackFrequency, fallbackDuration, fallbackGain));
      }
    },
    [playFallbackBeep]
  );

  const playTickSound = useCallback(() => {
    playAudio(
      tickAudioRef.current,
      tickFallbackFrequency,
      tickFallbackDuration,
      tickFallbackGain
    );
  }, [playAudio, tickFallbackDuration, tickFallbackFrequency, tickFallbackGain]);

  const playGoSound = useCallback(() => {
    playAudio(goAudioRef.current, goFallbackFrequency, goFallbackDuration, goFallbackGain);
  }, [goFallbackDuration, goFallbackFrequency, goFallbackGain, playAudio]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tick = new Audio(tickSrc);
    tick.preload = 'auto';
    tick.volume = tickVolume;

    const go = new Audio(goSrc);
    go.preload = 'auto';
    go.volume = goVolume;

    tickAudioRef.current = tick;
    goAudioRef.current = go;

    return () => {
      tick.pause();
      go.pause();
      tickAudioRef.current = null;
      goAudioRef.current = null;

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [goSrc, goVolume, tickSrc, tickVolume]);

  return {
    unlockAudio,
    playTickSound,
    playGoSound,
  };
};
