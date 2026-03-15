# CodePrix — Full-Stack Tech Event Website

## Project Structure

```
codeprix/
├── frontend/          # Next.js app (UI, pages, components)
├── backend/           # Node.js + Express API
└── README.md
```

## Getting Started

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

## Frontend Structure
- `app/` — Next.js App Router pages
- `components/` — Reusable UI components
- `styles/` — Global and module CSS
- `animations/` — Animation frame sequences and logic
- `lib/` — Utility helpers
- `public/assets/` — Static images, logos, animation frames

## Backend Structure
- `src/routes/` — Express route definitions
- `src/controllers/` — Route handler logic
- `src/models/` — Data models
- `src/middleware/` — Auth, error handling, etc.
- `src/config/` — Environment and app config
