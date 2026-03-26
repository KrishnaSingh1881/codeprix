'use client';

import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'error' | 'success' | null;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (type) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for fade-out animation
      }, 3700);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  if (!type && !visible) return null;

  return (
    <div className={`fixed bottom-8 left-1/2 z-[2000] -translate-x-1/2 flex items-center gap-3 rounded-full border px-6 py-3 shadow-2xl transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} ${type === 'error' ? 'border-red-500/40 bg-red-500/10 text-red-500' : 'border-[#00c853]/40 bg-[#00c853]/10 text-[#00c853]'}`}>
      <span className="text-sm">{type === 'error' ? '❌' : '✅'}</span>
      <span className="font-racing text-[10px] uppercase tracking-[0.2em] font-bold text-white/90">{message}</span>
    </div>
  );
}
