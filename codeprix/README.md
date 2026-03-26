# 🏎️ CodePrix — The Ultimate Coding Race

> **"Speed is the essence. Precision is the victory."**
> CodePrix is a high-octane competitive coding platform inspired by Formula 1 telemetry and race control. Battle through sectors of rapid-fire technical challenges and maintain your lead on the live leaderboard.

---

## 🚦 Features

### 🏁 **Race Control HUD**
- **Dynamic Monza Circuit**: A real-time SVG trace of the *Autodromo Nazionale Monza* that updates perfectly as you progress through questions.
- **Mission Control Timer**: Precision clock tracking performance with high-visibility penalty shakes.
- **Strategic Secrecy**: Correct/Incorrect feedback is hidden during the race to ensure maximum suspense until results are released.

### 📊 **Advanced Leaderboard**
- **Real-time Standings**: Live tracking of all teams with millisecond precision.
- **Post-Race Analytics**: Reveal full scoring and total penalties only when the checkered flag drops.
- **F1 Style Podium**: Top 3 finishers celebrated with a high-end gold/silver/bronze podium UI.

### 🛡️ **Admin Dashboard**
- **Race Orchestration**: Start, Stop, and Reset races for all participants instantly.
- **Real-time Oversight**: Monitor all team progress and penalties from a central command center.
- **Results Release**: Control exactly when the final standings are published to the participants.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Database/Auth**: [Supabase](https://supabase.com/) (Real-time DB, PostgreSQL)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [GSAP](https://greensock.com/gsap/)
- **Visuals**: Accurate SVG circuit tracing & Italian GP styling

---

## 📁 System Architecture

The project is now fully **Serverless**, utilizing Supabase for all state management, eliminating the need for a separate Node.js backend.

- `frontend/app/` - F1 HUD, Dashboard, and Admin Control
- `frontend/components/` - Race control panels, Monza SVG Track, Leaderboard
- `frontend/lib/` - Real-time Supabase hooks & Leaderboard logic
- `public/sounds/` - F1 starting lights, race complete fanfare

---

## 🚀 Deployment (Vercel)

1. **GitHub Setup**: 
   Push your repository to GitHub.
2. **Import to Vercel**: 
   Import the project and set the **Root Directory** to `frontend`.
3. **Environment Variables**:
   Add these in Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ADMIN_PASSWORD` (for `/admin` access)

---

## 📄 Key Routes

| Route | Description |
|---|---|
| `/` | **Landing Page** — Hero animation & pit lane entry |
| `/race` | **The Circuit** — Live racing interface (Participant HUD) |
| `/dashboard` | **The Paddock** — Pre-race status & countdowns |
| `/admin/login` | **Race Control Entry** — Secure admin login |
| `/admin/dashboard`| **Grand Prix Management** — Orchestrate the race |

---

<div align="center">
  <strong>🏎️ May the fastest coder win. 🏁</strong>
</div>ing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m "feat: add your feature"`
4. **Push** to your fork: `git push origin feature/your-feature-name`
5. **Open** a Pull Request against `main`

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📜 License

This project is created for the **CodePrix** tech event. All rights reserved.

---

<div align="center">
  <strong>🏎️ May the fastest coder win. 🏁</strong>
</div>
