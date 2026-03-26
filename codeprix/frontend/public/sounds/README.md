# /public/sounds — Audio Assets

| File | Used for | Status |
|------|----------|--------|
| `sector_complete.mp3` | Sector transition overlay | ✅ Placed |
| `penalty.mp3` | Tab-switch / focus-lost penalty | ✅ Placed |
| `race_complete.mp3` | Race finish fanfare | ✅ Placed |
| `Leaderboard.mp3` | Leaderboard overlay open | ✅ Placed |

Countdown and launch sounds reuse existing assets from `/assets/audio/`:
- `f1-start-light.mp3` → countdown tick per light
- `f1-lights-out.mp3` → launch / lights-out go signal

All files are loaded by `lib/useAudio.ts`.
If a file fails to load, the hook falls back to a Web Audio API synthesized beep.
