# StudyFlow

AI-powered learning companion that researches topics, organizes information, and creates structured study guides using the You.com API.

[Live Preview](https://study-flow-jgy7.vercel.app/)

## Features

- **Topic Research** — Enter any topic and get a structured learning path with sections, resources, and citations
- **Follow-up Q&A** — Ask questions about your topic with streaming AI responses
- **Source Viewing** — Read articles and watch videos directly in-app with full-screen modals
- **Export** — Download sessions as Markdown files
- **Keyboard Shortcuts** — Cmd/Ctrl+K to focus input, Cmd/Ctrl+E to export, Cmd/Ctrl+N for new topic
- **Dark Mode** — Light, dark, and system theme support
- **Session Management** — Sidebar with date grouping, search, and session history
- **Responsive Design** — Works on mobile (drawer sidebar), tablet, and desktop

## Screenshots

*Coming soon*

## Tech Stack

- **React 19** + TypeScript
- **Vite** — Build tooling
- **Tailwind CSS v3** + shadcn/ui design tokens
- **Zustand** — State management with localStorage persistence
- **Framer Motion** — Animations
- **Sonner** — Toast notifications
- **React Markdown** + Prism syntax highlighting

## You.com APIs Used

| API | Endpoint | Purpose |
|-----|----------|---------|
| Search | `GET /search` | Web search for topic enrichment |
| Agent | `POST /agents/runs` | AI research with SSE streaming |
| Contents | `POST /contents` | Fetch article content for in-app reading |

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
│   ├── agent/          # AgentThinkingDisplay, ResponseCard, MarkdownRenderer, CitationCard
│   ├── layout/         # Header, Sidebar, InputBar, WelcomeScreen
│   ├── learning/       # TopicExplorerCard, SectionAccordion, ResourceCard, SessionCard
│   ├── modals/         # SourceReaderModal, VideoPlayerModal, KeyboardShortcutsModal, YouTubeEmbed
│   ├── ui/             # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── ErrorBoundary.tsx
│   ├── SettingsPage.tsx
│   └── ApiTestPage.tsx
├── hooks/
│   ├── useStudyFlow.ts         # Main app hook
│   ├── useAgentOrchestration.ts # Topic/question orchestration
│   ├── useAgentStream.ts       # SSE streaming
│   ├── useKeyboardShortcuts.ts # Global keyboard shortcuts
│   └── useDebounce.ts
├── lib/
│   ├── api/            # You.com client, types, error classes
│   ├── store/          # Zustand stores (study, settings)
│   ├── utils/          # cn, video detection
│   ├── export.ts       # Markdown export
│   └── query.ts        # React Query client
└── App.tsx
```

## License

MIT
