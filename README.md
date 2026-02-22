# StudyFlow

An AI-powered learning companion that generates structured learning paths from any topic, with curated articles, videos, an interactive study assistant, and cloud sync.

[**Live Demo**](https://study-flow-jgy7.vercel.app/)

## Features

- **AI Learning Paths** — Enter any topic and get a structured curriculum with modules, estimated time, and difficulty rating
- **Curated Resources** — Each module is automatically populated with relevant articles and videos
- **Study Assistant** — Context-aware AI tutor for each module with per-module conversation threads and suggested follow-ups
- **Progress Tracking** — Mark modules complete with a visual progress bar
- **Shareable Paths** — Share any learning path via a public link; others can clone it to their own account
- **Google Auth + Cloud Sync** — Sign in with Google; all paths and progress are saved to Supabase
- **Source Viewer** — Read articles and watch videos in-app with full-screen modals
- **Export** — Download sessions as Markdown files
- **Dark Mode** — Light, dark, and system theme support
- **Resizable Layout** — Drag the study assistant panel to your preferred width

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v3 + shadcn/ui |
| State | Zustand (Supabase is the persistence layer — no localStorage) |
| Backend | Supabase (Auth, PostgreSQL, RLS) |
| Routing | React Router v7 |
| AI | Claude API (learning path generation + study assistant) |
| Animations | Framer Motion |
| Deployment | Vercel + Vercel Analytics |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key (entered in-app, never stored server-side)

### Install

```bash
git clone https://github.com/phamthanhhang208/study-flow.git
cd study-flow
npm install
```

### Environment Variables

Create a `.env` file at the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build

```bash
npm run build
```

## Database Setup

Run the following SQL in your Supabase SQL editor.

<details>
<summary><strong>learning_paths</strong></summary>

```sql
create table learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  topic text not null,
  title text,
  overview text,
  difficulty text,
  estimated_total_minutes integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table learning_paths enable row level security;

create policy "Users own their paths"
  on learning_paths for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public can read shared paths"
  on learning_paths for select
  using (id in (select path_id from shared_paths));
```
</details>

<details>
<summary><strong>modules</strong></summary>

```sql
create table modules (
  id uuid primary key default gen_random_uuid(),
  path_id uuid references learning_paths(id) on delete cascade not null,
  title text not null,
  description text,
  order_index integer not null,
  estimated_minutes integer,
  search_query text,
  difficulty text,
  module_status text default 'complete',
  resources jsonb,
  created_at timestamptz default now()
);

alter table modules enable row level security;

create policy "Users own their modules"
  on modules for all
  using (path_id in (select id from learning_paths where user_id = auth.uid()))
  with check (path_id in (select id from learning_paths where user_id = auth.uid()));

create policy "Public can view modules of shared paths"
  on modules for select
  using (path_id in (select path_id from shared_paths));
```
</details>

<details>
<summary><strong>module_progress</strong></summary>

```sql
create table module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  module_id uuid references modules(id) on delete cascade not null,
  completed_at timestamptz,
  unique(user_id, module_id)
);

alter table module_progress enable row level security;

create policy "Users own their progress"
  on module_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>shared_paths</strong></summary>

```sql
create table shared_paths (
  id uuid primary key default gen_random_uuid(),
  path_id uuid references learning_paths(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  slug text unique not null default substr(md5(random()::text), 1, 10),
  created_at timestamptz default now()
);

alter table shared_paths enable row level security;

-- Unconditional SELECT is required to avoid RLS recursion with learning_paths
create policy "Public can read shared_paths"
  on shared_paths for select
  using (true);

create policy "Owner manages shared paths"
  on shared_paths for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```
</details>

### Google OAuth

1. In Supabase → Authentication → Providers, enable **Google**
2. Add credentials from [Google Cloud Console](https://console.cloud.google.com)
3. Add your site URL to the allowed redirect URLs in Supabase

## Project Structure

```
src/
├── components/
│   ├── auth/           # LoginPage (Google OAuth gate)
│   ├── layout/         # Header, Sidebar, InputBar, WelcomeScreen
│   ├── learning/       # ModuleNavHorizontal, ContentTabs, StudyAssistant,
│   │                   # OrchestrationProgress
│   ├── modals/         # SourceReaderModal, VideoPlayerModal, KeyboardShortcutsModal
│   ├── ui/             # shadcn/ui primitives
│   ├── ErrorBoundary.tsx
│   └── SettingsPage.tsx
├── context/
│   └── AuthContext.tsx
├── hooks/
│   ├── useStudyFlow.ts           # Main app hook
│   ├── useAgentOrchestration.ts  # Topic + question orchestration
│   └── useKeyboardShortcuts.ts
├── lib/
│   ├── api/            # Claude agents (moduleGenerator, tutorAgent, types)
│   ├── db/             # Supabase data layer (learningPaths, moduleProgress, sharedPaths)
│   ├── store/          # Zustand stores (studyStore, settingsStore)
│   └── utils/
├── pages/
│   └── ShareView.tsx   # Public read-only shared path + clone flow
└── App.tsx
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `/` | Focus input |
| `N` | New topic |
| `E` | Export session |
| `?` | Toggle shortcuts help |
| `Escape` | Close modals |

## License

MIT
