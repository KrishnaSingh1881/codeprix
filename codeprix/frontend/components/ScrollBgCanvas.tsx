'use client';

import { useEffect, useRef } from 'react';

interface Props {
  folder: string;   // e.g. "frames2"
  total: number;    // total frame count
  blur?: number;    // px blur, default 8
  dimOpacity?: number; // dark overlay opacity 0–1, default 0.55
}

export default function ScrollBgCanvas({ folder, total, blur = 8, dimOpacity = 0.55 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef   = useRef<HTMLDivElement | null>(null);
  const imgs       = useRef<HTMLImageElement[]>([]);
  const loaded     = useRef(0);
  const frameIdx   = useRef(0);
  const rafPending = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;

    // Use the scrollable page container (document body)
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      draw(frameIdx.current);
    };

    const draw = (i: number) => {
      const img = imgs.current[i];
      if (!img?.complete || !img.naturalWidth) return;
      const cw = canvas.width, ch = canvas.height;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const s  = Math.max(cw / iw, ch / ih);
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, 0, 0, iw, ih, (cw - iw * s) / 2, (ch - ih * s) / 2, iw * s, ih * s);
    };

    const onScroll = () => {
      const scrolled  = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const prog      = maxScroll > 0 ? Math.min(1, scrolled / maxScroll) : 0;
      frameIdx.current = Math.min(total - 1, Math.floor(prog * (total - 1)));
      if (!rafPending.current) {
        rafPending.current = true;
        requestAnimationFrame(() => {
          rafPending.current = false;
          draw(frameIdx.current);
        });
      }
    };

    // Preload
    resize();
    for (let i = 0; i < total; i++) {
      const img = new Image();
      img.onload = () => {
        loaded.current++;
        if (loaded.current === 1) { resize(); draw(0); }
      };
      img.src = `/${folder}/ezgif-frame-${String(i + 1).padStart(3, '0')}.jpg`;
      imgs.current[i] = img;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
    };
  }, [folder, total]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      {/* Blurred canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          filter: `blur(${blur}px)`,
          transform: 'scale(1.04)', // hide blur edge artifacts
        }}
      />
      {/* Dark overlay for readability */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `rgba(0,0,0,${dimOpacity})`,
      }} />
    </div>
  );
}
