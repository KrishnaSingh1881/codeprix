'use client';

interface MuteButtonProps {
  muted: boolean;
  onToggle: () => void;
}

export default function MuteButton({ muted, onToggle }: MuteButtonProps) {
  return (
    <button
      onClick={onToggle}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
      className="fixed right-5 top-[72px] z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-black/80"
    >
      <span className="text-base leading-none">
        {muted ? '🔇' : '🔊'}
      </span>
    </button>
  );
}
