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

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | High-performance React framework with server-side optimizations. |
| **Logic** | TypeScript | Type-safe development for complex race state management. |
| **Backend** | Supabase (PostgreSQL) | Real-time database, auth, and state synchronization. |
| **Styling** | Tailwind CSS & Vanilla CSS | Custom F1-themed design tokens and glassmorphism UI. |
| **Animation** | Framer Motion | Smooth component transitions and SVG path tracking. |

### 🛰️ **AI Context & Repository Analysis**
The repository is structured as a **Mono-Repo style** folder. 
- `/frontend`: The core Next.js application.
- `/frontend/components`: High-impact UI components (Circuit HUD, Leaderboard, Admin Sidebar).
- `/frontend/lib`: Core logic for race timers, leaderboard sorting, and Supabase integration.
- `Database Schema`: Managed via Supabase, centered around `event_config`, `attempts`, and `answers`.

---

## 🚀 Deployment (Vercel Ready)
1. **Import Reposity**: Select the root folder or set `frontend/` as the sub-folder.
2. **Environment Variables**:
   * `NEXT_PUBLIC_SUPABASE_URL`: Your project endpoint.
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your publishable key.
   * `NEXT_PUBLIC_ADMIN_PASSWORD`: For Admin dashboard access.
3. **Root Directory**: Ensure Vercel is set to build from the `frontend/` directory.

---

## 🏁 Final Checkered Flag
CodePrix is more than a quiz; it's a precision-engineered event platform designed to be wowed at first sight. Ready your drivers, set your questions, and let the race begin!

**GitHub Repo**: [https://github.com/KrishnaSingh1881/codeprix.git](https://github.com/KrishnaSingh1881/codeprix.git)
