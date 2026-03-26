'use client';

import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  desc: string;
  type?: 'danger' | 'info';
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  desc,
  type = 'info',
  confirmText = 'Execute',
  cancelText = 'Abort'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full max-w-sm overflow-hidden rounded-[32px] border bg-[#0d0d0d] p-8 text-center shadow-2xl ${type === 'danger' ? 'border-red-500/20' : 'border-white/10'}`}>
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6 ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-white'}`}>
           <span className="text-2xl">{type === 'danger' ? '⚠️' : 'ℹ️'}</span>
        </div>
        <h3 className="font-racing text-lg uppercase tracking-widest text-white font-black">{title}</h3>
        <p className="mt-4 font-sans text-xs text-white/50 leading-relaxed">{desc}</p>
        <div className="mt-8 flex gap-3">
           <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-4 font-racing text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all">
             {cancelText}
           </button>
           <button onClick={onConfirm} className={`flex-1 rounded-xl py-4 font-racing text-[10px] uppercase tracking-widest text-white transition-all ${type === 'danger' ? 'bg-[#E10600] hover:bg-white hover:text-black' : 'bg-white/10 hover:bg-white/20'}`}>
             {confirmText}
           </button>
        </div>
      </div>
    </div>
  );
}
