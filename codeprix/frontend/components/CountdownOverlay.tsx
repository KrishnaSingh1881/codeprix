'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';

interface CountdownOverlayProps {
  sequenceStep: number;
  sequenceRunning: boolean;
}

export default function CountdownOverlay({ sequenceStep, sequenceRunning }: CountdownOverlayProps) {
  const [showGo, setShowGo] = useState(false);
  const lightsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const prevStep = useRef(-1);
  const prevRunning = useRef(false);

  // GSAP pop each light as it turns on
  useEffect(() => {
    if (sequenceStep >= 0 && sequenceStep !== prevStep.current) {
      const el = lightsRef.current[sequenceStep];
      if (el) {
        gsap.fromTo(el,
          { scale: 0.5, opacity: 0.2 },
          { scale: 1, opacity: 1, duration: 0.2, ease: 'back.out(2.5)' }
        );
      }
    }
    prevStep.current = sequenceStep;
  }, [sequenceStep]);

  // Lights-out → GO
  useEffect(() => {
    if (!sequenceRunning && prevRunning.current) {
      setShowGo(true);
      const timer = setTimeout(() => setShowGo(false), 1200);
      return () => clearTimeout(timer);
    }
    prevRunning.current = sequenceRunning;
  }, [sequenceRunning]);

  const visible = sequenceRunning || showGo;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="countdown"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
        >
          {/* Launch light pods */}
          <div className="flex gap-5">
            {Array.from({ length: 5 }).map((_, idx) => {
              const lit = sequenceStep >= idx && sequenceStep >= 0 && !showGo;
              return (
                <div key={idx} className="flex h-[100px] w-[60px] flex-col items-center justify-center gap-2 rounded-[18px] border border-white/15 bg-[#0a0c10]">
                  {/* 3 stacked lights per pod like real F1 */}
                  {[0, 1, 2].map((row) => (
                    <span
                      key={row}
                      ref={row === 0 ? (el) => { lightsRef.current[idx] = el; } : undefined}
                      className="block h-6 w-6 rounded-full border transition-all duration-75"
                      style={{
                        borderColor: lit ? 'rgba(255,95,88,0.95)' : 'rgba(255,255,255,0.12)',
                        background: lit
                          ? 'radial-gradient(circle at 35% 30%, #ff6b5f, #e10600)'
                          : '#1c1c1c',
                        boxShadow: lit
                          ? '0 0 18px rgba(225,6,0,0.8), 0 0 6px rgba(225,6,0,0.5)'
                          : 'none',
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 font-racing text-[11px] uppercase tracking-[0.4em] text-white/35"
          >
            {sequenceRunning ? 'Prepare to race...' : ''}
          </motion.p>

          {/* GO flash */}
          <AnimatePresence>
            {showGo && (
              <motion.div
                key="go"
                initial={{ scale: 0.4, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.4, opacity: 0, y: -30 }}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                className="absolute font-racing text-[9rem] leading-none tracking-[0.08em] text-[#00c853]"
                style={{ textShadow: '0 0 80px rgba(0,200,83,0.9), 0 0 30px rgba(0,200,83,0.6)' }}
              >
                GO
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
