'use client';

import { useEffect, useRef } from 'react';

const TOTAL = 240;

export default function HeroAnimation() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const heroRef    = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const cinemaRef  = useRef<HTMLDivElement>(null);
  const loaderRef  = useRef<HTMLDivElement>(null);
  const fillRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas  = canvasRef.current!;
    const hero    = heroRef.current!;
    const ctx     = canvas.getContext('2d')!;
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;
    let frame  = 0;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = (i: number) => {
      const img = imgs[i];
      if (!img?.complete || !img.naturalWidth) return;
      const { width: cw, height: ch } = canvas;
      const iw = img.naturalWidth;
      const ih = Math.floor(img.naturalHeight * 0.94); // crop 6% bottom
      const s  = Math.max(cw / iw, ch / ih);
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, 0, 0, iw, ih, (cw - iw * s) / 2, (ch - ih * s) / 2, iw * s, ih * s);
    };

    const onScroll = () => {
      const prog = Math.min(1, Math.max(0, window.scrollY - hero.offsetTop) / (hero.offsetHeight - window.innerHeight));
      frame = Math.min(TOTAL - 1, Math.floor(prog * (TOTAL - 1)));

      // Logo fades out early
      if (overlayRef.current) overlayRef.current.style.opacity = String(Math.max(0, 1 - prog / 0.2));

      // Cinema effect: starts at 40% scroll, fully in at 70%
      const cinemaT = Math.max(0, (prog - 0.4) / 0.3); // 0→1 over 70%–90%
      if (cinemaRef.current) {
        cinemaRef.current.style.opacity = String(cinemaT);
      }
      if (canvasRef.current) {
        const blur = cinemaT * 5; // max 5px blur
        canvasRef.current.style.filter = cinemaT > 0 ? `blur(${blur.toFixed(1)}px)` : '';
      }

      // Tagline fades IN over 65%–90%
      if (taglineRef.current) taglineRef.current.style.opacity = String(Math.max(0, (prog - 0.65) / 0.25));

      requestAnimationFrame(() => draw(frame));
    };

    // Preload all frames
    resize();
    for (let i = 0; i < TOTAL; i++) {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (fillRef.current) fillRef.current.style.width = (loaded / TOTAL * 100) + '%';
        if (loaded === 1) { resize(); draw(0); }
        if (loaded === TOTAL && loaderRef.current) {
          loaderRef.current.style.opacity = '0';
          loaderRef.current.style.pointerEvents = 'none';
          setTimeout(() => { if (loaderRef.current) loaderRef.current.style.display = 'none'; }, 700);
        }
      };
      img.onerror = () => {
        loaded++; // Count error as loaded to avoid getting stuck
        if (loaded === TOTAL && loaderRef.current) {
          loaderRef.current.style.opacity = '0';
          loaderRef.current.style.pointerEvents = 'none';
          setTimeout(() => { if (loaderRef.current) loaderRef.current.style.display = 'none'; }, 700);
        }
      };
      img.src = `/frames/ezgif-frame-${String(i + 1).padStart(3, '0')}.jpg`;
      imgs[i] = img;
    }

    // Safety timeout: hide loader after 10s regardless of images
    const safetyTimeout = setTimeout(() => {
      if (loaderRef.current && loaderRef.current.style.display !== 'none') {
        loaderRef.current.style.opacity = '0';
        loaderRef.current.style.pointerEvents = 'none';
        setTimeout(() => { if (loaderRef.current) loaderRef.current.style.display = 'none'; }, 700);
      }
    }, 10000);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { resize(); draw(frame); });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(safetyTimeout);
    };
  }, []);

  return (
    <div ref={heroRef} style={{ position: 'relative', height: '280vh' }}>

      {/* Loader */}
      <div ref={loaderRef} style={{
        position: 'fixed', inset: 0, background: '#000', zIndex: 999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 0.7s ease',
      }}>
        <span style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Loading</span>
        <div style={{ width: 160, height: 1, background: 'rgba(255,255,255,0.1)' }}>
          <div ref={fillRef} style={{ height: '100%', width: '0%', background: '#fff', transition: 'width 0.08s linear' }} />
        </div>
      </div>

      {/* Sticky viewport */}
      <div style={{ position: 'sticky', top: 0, width: '100%', height: '100vh', overflow: 'hidden', background: '#000' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {/* Cinematic dark overlay — fades in over final scroll portion */}
        <div ref={cinemaRef} style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          opacity: 0,
          zIndex: 5,
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div ref={overlayRef} style={{
          position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
          width: 'clamp(180px, 40vw, 560px)', zIndex: 10, pointerEvents: 'none',
        }}>
          <img src="/assets/codeprix-title.jpeg" alt="CODEPRIX" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>

        {/* Tagline image — centered, fades in near end of animation */}
        <div ref={taglineRef} style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10, pointerEvents: 'none',
          width: 'clamp(220px, 38vw, 560px)',
          opacity: 0,
        }}>
          {/* Radial gradient mask to fade image edges into black */}
          <div style={{
            position: 'relative',
            WebkitMaskImage: 'radial-gradient(ellipse 55% 55% at 50% 50%, black 20%, transparent 70%)',
            maskImage: 'radial-gradient(ellipse 55% 55% at 50% 50%, black 20%, transparent 70%)',
          }}>
            <img
              src="/assets/wherecodemeetsspeed.jpeg"
              alt="Where Code Meets Speed"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 36, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 10, letterSpacing: '0.25em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
          }}>Scroll</span>
          <div style={{
            width: 24, height: 38, borderRadius: 12,
            border: '1.5px solid rgba(255,255,255,0.25)',
            display: 'flex', justifyContent: 'center', paddingTop: 6,
          }}>
            <div style={{
              width: 4, height: 8, borderRadius: 2,
              background: 'rgba(255,255,255,0.7)',
              animation: 'scrollDot 1.6s ease-in-out infinite',
            }} />
          </div>
          <style>{`
            @keyframes scrollDot {
              0%   { transform: translateY(0);   opacity: 1; }
              80%  { transform: translateY(12px); opacity: 0; }
              100% { transform: translateY(0);   opacity: 0; }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
