# StudyFlow

AI-powered learning companion that researches topics, builds structured learning paths, and provides a context-aware tutor using the You.com API.

[Live Preview](https://study-flow-jgy7.vercel.app/)

## Features

- **Learning Path Orchestration** — Enter any topic and get a structured learning path with 3-5 modules, each populated with curated articles and videos
- **Module Navigation** — Horizontal scrollable module cards with active state, time estimates, and difficulty levels
- **Deep Explanation** — Rich content view per module with article summaries, citation references, and key focus areas
- **Media Resources** — Video grid with YouTube/Vimeo thumbnails, duration, and in-app playback
- **Study Assistant** — Context-aware Q&A sidebar that knows your current module, maintains per-module conversation threads, and suggests follow-up questions
- **Inline Citations** — Clickable citation badges in tutor responses linked to module resources
- **Source Viewing** — Read articles and watch videos directly in-app with full-screen modals
- **Export** — Download sessions and conversations as Markdown files
- **Keyboard Shortcuts** — Cmd/Ctrl+K to focus input, Cmd/Ctrl+E to export, Cmd/Ctrl+N for new topic
- **Dark Mode** — Light, dark, and system theme support
- **Session Management** — Sidebar with date grouping, search, and session history
- **Responsive Design** — 3-column layout on desktop (sidebar | content | study assistant), collapses on mobile

## Tech Stack

- **React 19** + TypeScript
- **Vite** — Build tooling
- **Tailwind CSS v3** + shadcn/ui design tokens
- **Zustand** — State management with localStorage persistence
- **Framer Motion** — Animations
- **Sonner** — Toast notifications
- **React Markdown** + Prism syntax highlighting
- **Radix UI** — Tabs and other accessible primitives

## You.com APIs Used

| API | Endpoint | Purpose |
|-----|----------|---------|
| Search | `GET /search` | Web search for module resource enrichment |
| Agent (non-streaming) | `POST /agents/runs` | Module outline generation and tutor Q&A |
| Agent (streaming) | `POST /agents/runs` | Follow-up question streaming |
| Contents | `POST /contents` | Fetch article content for in-app reading |

## Architecture

### Learning Path Pipeline

1. **Module Generation** — LLM breaks topic into 3-5 structured sub-modules with titles, descriptions, search queries, and time estimates
2. **Resource Fetching** — Parallel You.com Search API calls populate each module with articles and videos (general + video-focused searches)
3. **Orchestration Progress** — Real-time step indicators during path creation

### Study Assistant (Q&A Tutor)

- Context-aware responses referencing current module content, articles, and videos
- Per-module conversation threads persisted in localStorage
- Suggested questions on empty conversations, follow-up suggestions from tutor
- Inline citation parsing with clickable badges

## Setup

1. Clone the repository:

```bash
git clone https://github.com/phamthanhhang208/study-flow.git
cd study-flow
```

2. Install dependencies:

```bash
npm install
```

3. Set up your You.com API key. Either:
   - Create a `.env` file with `VITE_YOUCOM_API_KEY=your_key_here`
   - Or enter it in the Settings page within the app

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

Output is in the `dist/` directory.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Focus input |
| `Cmd/Ctrl + E` | Export session |
| `Cmd/Ctrl + N` | New topic |
| `Cmd/Ctrl + /` | Show shortcuts help |
| `Escape` | Close modals |
| `Enter` | Send message |
| `Shift + Enter` | New line |

## Project Structure

```
src/
├── components/
│   ├── agent/          # ResponseCard, MarkdownRenderer, CitationCard
│   ├── layout/         # Header, Sidebar, InputBar, WelcomeScreen
│   ├── learning/       # ModuleNavHorizontal, ContentTabs, DeepExplanation,
│   │                   # MediaResourcesGrid, StudyAssistant, MessageBubble,
│   │                   # OrchestrationProgress, SessionCard
│   ├── modals/         # SourceReaderModal, VideoPlayerModal, KeyboardShortcutsModal
│   ├── ui/             # shadcn/ui primitives (button, card, dialog, tabs, etc.)
│   ├── ErrorBoundary.tsx
│   └── SettingsPage.tsx
├── hooks/
│   ├── useStudyFlow.ts         # Main app hook
│   ├── useAgentOrchestration.ts # Topic/question orchestration
│   ├── useAgentStream.ts       # SSE streaming
│   └── useKeyboardShortcuts.ts # Global keyboard shortcuts
├── lib/
│   ├── api/            # You.com client, types, error classes,
│   │                   # moduleGenerator, resourceFetcher,
│   │                   # learningPathOrchestrator, tutorAgent
│   ├── store/          # Zustand stores (study, settings)
│   ├── utils/          # cn, video detection
│   ├── export.ts       # Markdown export (sessions + conversations)
│   └── query.ts        # React Query client
└── App.tsx
```

## License

MIT
