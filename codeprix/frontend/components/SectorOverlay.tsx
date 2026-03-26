'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface SectorOverlayProps {
  sector: number;
  visible: boolean;
}

export default function SectorOverlay({ sector, visible }: SectorOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`sector-${sector}`}
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.38, ease: [0.32, 0, 0.67, 0] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#050505]"
        >
          {/* Top stripe — animates in */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.35, delay: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: 'left center' }}
            className="absolute top-0 left-0 right-0 h-[3px] bg-[#E10600]"
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-center"
          >
            <p className="font-racing text-[11px] uppercase tracking-[0.5em] text-[#E10600]">
              CODEPRIX // RACE CONTROL
            </p>
            <h2 className="mt-4 font-racing text-[7rem] leading-none tracking-[0.04em] text-white sm:text-[9rem]">
              SECTOR {sector}
            </h2>
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.3, delay: 0.35, ease: 'easeOut' }}
              style={{ transformOrigin: 'center' }}
              className="mt-5 flex items-center justify-center gap-4"
            >
              <div className="h-[2px] w-20 bg-[#E10600]" />
              <p className="font-racing text-sm uppercase tracking-[0.4em] text-white/50">BEGINS</p>
              <div className="h-[2px] w-20 bg-[#E10600]" />
            </motion.div>
          </motion.div>

          {/* Bottom stripe */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.35, delay: 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: 'right center' }}
            className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#E10600]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
