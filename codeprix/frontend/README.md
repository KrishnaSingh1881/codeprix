# 🏎️ CodePrix — Admin Operations Guide

## Question Bank Management

### Bulk Import via JSON File (Recommended)

A sample file is provided at `frontend/questions.sample.json` — copy and edit it.

**JSON Format:**
```json
[
  {
    "body": "What does DRS stand for in F1?",
    "option_a": "Direct Race System",
    "option_b": "Drag Reduction System",
    "option_c": "Downforce Relay Speed",
    "option_d": "Dynamic Race Stability",
    "correct_option": "B",
    "sector": 1
  }
]
```

> `correct_option` must be `"A"`, `"B"`, `"C"`, or `"D"`.  
> `sector` must be `1`, `2`, or `3`.

**Steps:**
1. Go to `/admin/questions`
2. Click **"⬆ Import JSON/CSV"**
3. Select your `.json` file → questions are inserted instantly

**CSV Format** (header row required):
```
body,option_a,option_b,option_c,option_d,correct_option,sector
"What does DRS stand for?","Direct Race","Drag Reduction","Downforce","Dynamic","B",1
```

**Export:** Click **"⬇ Export JSON"** to download all current questions as a JSON file.

---



### Option 1: Bulk Import via JSON File (Recommended for Events)

This is the fastest way to set up all participants before a race event.

**Step 1 — Create your JSON file**

Create a file named `participants.json` (or any name) with this exact format:

```json
[
  { "team_name": "Ferrari",   "access_code": "ferrari2024"   },
  { "team_name": "RedBull",   "access_code": "redbull2024"   },
  { "team_name": "Mercedes",  "access_code": "mercedes2024"  },
  { "team_name": "McLaren",   "access_code": "mclaren2024"   },
  { "team_name": "Alpine",    "access_code": "alpine2024"    }
]
```

> A sample file is already provided at `frontend/participants.sample.json` — copy and edit it.

**Step 2 — Import via Admin Panel**

1. Open the admin panel at `/admin/participants`
2. Click **"⬆ Import CSV/JSON"** in the top-right
3. Select your `.json` file
4. All participants are created instantly. Duplicates are automatically skipped.

---

### Option 2: Import via CSV File

**CSV Format** (first row must be the header):

```
team_name,access_code
Ferrari,ferrari2024
RedBull,redbull2024
Mercedes,mercedes2024
```

Same process — click **"⬆ Import CSV/JSON"** and select your `.csv` file.

---

### Option 3: Register Teams One-by-One

1. Go to `/admin/participants`
2. Click **"+ Register Team"**
3. Enter team name and access code

---

### Option 4: Direct SQL Seed (via Supabase Editor)

For very large participant lists, paste this into the **Supabase SQL Editor**:

```sql
INSERT INTO participants (team_name, access_code) VALUES
  ('Ferrari', 'ferrari2024'),
  ('RedBull', 'redbull2024'),
  ('Mercedes', 'mercedes2024'),
  ('McLaren', 'mclaren2024'),
  ('Alpine', 'alpine2024')
ON CONFLICT (team_name) DO NOTHING;
```

---

## Race Management

### Start a Race (Step-by-step)

1. Go to `/admin/dashboard`
2. Click **"+ New Race"** → enter a name (e.g. "Qualifying Round")
3. Click **"Manage"** on the race card
4. Click **🟢 Start Race** — this opens the pit lane and activates the session
5. Participants can now log in and race

### End a Race

1. Go to the race manager view
2. Click **🏁 End Race** — the pit lane closes, no more submissions accepted

### Release Results

1. Click **📊 Release Results** inside the race manager
2. The leaderboard becomes visible to all participants at `/results`

### Delete a Race

- Click **"Delete"** on a race card (from the grid view), or
- Click **"Delete Race"** inside the race manager
- This permanently removes the race **and all attempt data** for it

---

## Exporting Participant Data

1. Go to `/admin/participants`
2. Click **"⬇ Export CSV"**
3. A timestamped CSV file downloads automatically: `codeprix_participants_YYYY-MM-DD.csv`

---

## Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ADMIN_PASSWORD=your-admin-password
```

---

## Database Setup (One-time)

Run these SQL commands in your Supabase SQL Editor to initialize the schema:

```sql
-- Fix sequence if you see "duplicate key" errors when creating races
CREATE SEQUENCE IF NOT EXISTS event_config_id_seq OWNED BY event_config.id;
ALTER TABLE event_config ALTER COLUMN id SET DEFAULT nextval('event_config_id_seq');
SELECT setval('event_config_id_seq', COALESCE((SELECT MAX(id) FROM event_config), 0) + 1, false);
```

---

## Running Locally

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Participant login |
| `/dashboard` | Participant dashboard |
| `/race` | Live race quiz |
| `/results` | Public leaderboard |
| `/admin` | Admin login |
| `/admin/dashboard` | Race control panel |
| `/admin/participants` | Participant management |
| `/admin/questions` | Question bank management |
