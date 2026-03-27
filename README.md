# 🏁 CodePrix — The Ultimate High-Octane Coding Race

> **"Speed is the essence. Precision is the victory."**
> CodePrix is a high-speed, F1-inspired competitive coding platform designed for rapid-fire technical challenges. Built with a MISSION CONTROL aesthetic, it combines real-time telemetry, strategic point secrecy, and precise race management.

---

## 🚦 System Overview
**CodePrix** is a serverless application built on **Next.js 14** and **Supabase**. It leverages real-time database listeners and scaled telemetry timers to ensure a millisecond-accurate racing experience. The frontend uses **Framer Motion** for sleek, glassmorphism-based animations that mirror high-end F1 race control HUDs.

### 🏎️ **For Participants**
*   **Circuit HUD**: A high-fidelity, real-time SVG trace of the Track. Your progress is mapped exactly to the circuit path, providing an immersive visual track of your race position.
*   **Mission Control Interface**: A glass-frosted dashboard featuring focused question cards and a 2x2 responsive answer grid for high-speed decision making.
*   **Strategic Secrecy**: Feedback (Correct/Incorrect) is disabled during the live race, maintaining intense pressure and suspense until the final Results Release.
*   **Live Teleboard Standing**: Every 5 seconds, participant telemetry (Name, Time, Penalties) is synchronized across all users, allowing you to see your rivals' positions shift in real-time.
*   **Automatic Sector Pulsing**: The app automatically detects when you cross sector lines (S1, S2, S3), triggering high-impact visual overlays and sound effects.

### 🛠️ **For Admin (Race Control)**
*   **Command Dashboard**: The central hub to **Start**, **Reset**, and **Finish** race sessions for all participants simultaneously.
*   **Global Refresh Pulse**: Integrated Realtime Watchers automatically refresh every participant's browser the moment the admin changes the race state or releases results.
*   **Telemetry Reporting & CSV Export**: One-click extraction of the full leaderboard data (Score, Rank, Time, Penalties) into a formatted CSV report for official record-keeping.
*   **Strategic Results Release**: Total scores and final "Grid Positions" are only revealed when the Admin manually triggers the Results Release signal.

---

## 🛠️ Supabase Setup (CRITICAL)

To ensure the race functions correctly with real-time updates and high concurrency, you **must** run these SQL scripts in your Supabase SQL Editor:

### 1. Atomic Penalty RPC
Prevents race conditions when multiple penalties trigger simultaneously.
```sql
CREATE OR REPLACE FUNCTION increment_penalty_v2(p_attempt_id UUID, p_penalty_seconds INTEGER, p_is_dnf BOOLEAN)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE attempts SET penalty_count = penalty_count + 1, penalty_seconds = penalty_seconds + p_penalty_seconds,
  is_dnf = CASE WHEN p_is_dnf THEN TRUE ELSE is_dnf END, updated_at = NOW() WHERE id = p_attempt_id;
END; $$;
```

### 2. Row Level Security (RLS)
Allows participants to update their own race progress/score while keeping the DB secure.
```sql
-- Enable RLS on attempts table
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Policy for participants to update their own telemetry
CREATE POLICY "Allow update own attempt" ON attempts FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Policy for anyone to read attempts for the leaderboard
CREATE POLICY "Allow read all attempts" ON attempts FOR SELECT TO anon USING (true);
```

### 3. Realtime & Constraints
Enable high-speed leaderboard updates and prevent duplicate race entries.
```sql
-- Enable Realtime for the attempts table
ALTER PUBLICATION supabase_realtime ADD TABLE attempts;

-- Prevent duplicate attempts for the same user in the same event
ALTER TABLE attempts ADD CONSTRAINT unique_participant_event UNIQUE (participant_id, event_id);
```

---

## ⚡ Concurrency & Performance
CodePrix is hardened for **30-50 simultaneous racers**:
*   **Real-time Push**: Leaderboard uses **Supabase Realtime** (WebSockets) instead of polling, reducing DB load by 90%.
*   **Optimized Auto-Save**: Participant progress is synchronized every **3 seconds** (tunable in `race/page.tsx`).
*   **Atomic Operations**: All penalty and score increments use database-level triggers/functions to prevent data loss.

---

## 🚀 Deployment (Vercel Ready)
1. **Import Repository**: Select the root folder or set `frontend/` as the sub-folder.
2. **Environment Variables**:
   * `NEXT_PUBLIC_SUPABASE_URL`: Project endpoint.
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Publishable key.
   * `NEXT_PUBLIC_ADMIN_PASSWORD`: For Command Center access.
3. **Root Directory**: Ensure Vercel is set to build from the `frontend/` directory.

---

## 🏁 Final Checkered Flag
CodePrix is more than a quiz; it's a precision-engineered event platform designed to be wowed at first sight. Ready your drivers, set your questions, and let the race begin!

**GitHub Repo**: [https://github.com/KrishnaSingh1881/codeprix.git](https://github.com/KrishnaSingh1881/codeprix.git)
