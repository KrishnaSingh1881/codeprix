'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAudio } from '@/lib/useAudio';

export default function IntroMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname();
  const { muted } = useAudio();
  const [interacted, setInteracted] = useState(false);

  // Initialize audio object once
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/intro.mp3');
      audio.loop = true;
      audio.volume = 0.5;
      audioRef.current = audio;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle Playback and Fade
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Sync muted state
    if (muted) {
      audio.muted = true;
    } else {
      audio.muted = false;
    }

    const isHome = pathname === '/';
    const isLogin = pathname === '/login';

    const handleInteraction = () => {
      if (pathname === '/' && !muted) {
        audio.volume = 0.5;
        audio.play().catch(() => {});
        setInteracted(true);
      }
    };

    const fadeIntervalRef = { current: null as any };

    if (isHome) {
      if (!interacted) {
        window.addEventListener('pointerdown', handleInteraction, { once: true });
        window.addEventListener('keydown', handleInteraction, { once: true });
      } else if (!muted) {
        audio.volume = 0.5;
        if (audio.paused) audio.play().catch(() => {});
      }
    } else if (isLogin) {
      // 8-second slow fade out, but ONLY after user starts typing
      const startFade = () => {
        fadeIntervalRef.current = setInterval(() => {
          if (audio.volume > 0.01) {
            audio.volume = Math.max(0, audio.volume - 0.00625);
          } else {
            audio.volume = 0;
            audio.pause();
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          }
        }, 100);
        window.removeEventListener('keydown', startFade);
      };

      window.addEventListener('keydown', startFade);
      return () => {
        window.removeEventListener('keydown', startFade);
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      };
    } else {
      // For other pages, we'll keep it playing if it was already playing,
      // unless the user specified otherwise. But many "intro" musics stop
      // when you enter the main app dashboard.
      // For now, let's keep it simple as requested.
    }

    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [pathname, interacted, muted]);

  return null;
}
