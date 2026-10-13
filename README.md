# ⚡ Cadence — The Daily Operating System for Learners & Creators

> A local-first, privacy-focused productivity suite designed for students, self-taught developers, and knowledge workers.

![License](https://img.shields.io/badge/license-MIT-emerald)
![Local-First](https://img.shields.io/badge/storage-local--first-blue)
![Privacy](https://img.shields.io/badge/auth-zero--login-violet)

---

## ✨ Features

- **⚡ Global Command Palette (`Ctrl + K` / `Cmd + K`)**:
  - Instant keyboard-driven navigation across all modules.
  - Quick action runner: toggle procedural sound, export database backups, or search features.

- **🔥 The Habit Loop Engine**:
  - Daily checklist with 1-click spring-physics checkboxes.
  - Live SVG circular progress ring & streak flame counters.
  - 7-day mini heatmap strips (M T W T F S S).
  - Expandable **Cue ➔ Routine ➔ Reward** drawers for every habit.
  - Procedural sound feedback & celebration confetti.

- **📅 Adaptive 24-Hour Timetable**:
  - Proportional 24-hour timeline bar with automatic free-time calculation.
  - Day-by-day scheduler (Monday to Sunday) with transit & buffer blocks.
  - 1-click **RFC 5545 `.ics` export** for instant sync into Google Calendar, Apple Calendar, and Outlook.

- **⏱️ Deep Focus Studio**:
  - Pomodoro intervals (25m classic, 45m class block, 90m deep work) & split-lap stopwatch.
  - Procedural Web Audio ambient noise generator (Brown Noise, White Noise, Rain) — 100% offline.
  - Distraction-free full-screen Zen Mode.

- **📋 Assignment & Task Kanban**:
  - 3-column workflow: To Do ➔ In Progress ➔ Completed.
  - Priority badges (Urgent, High, Medium, Low) and due date countdowns.

- **📝 Notes & STEM Formulas Scratchpad**:
  - Markdown note-taking with live preview and tag filtering.
  - Quick-insert Math & Physics formula drawer (Quadratic, Newton's 2nd Law, Calculus integrals, etc.).
  - 1-click scientific symbol inserter (`²`, `³`, `√`, `∑`, `∫`, `±`, `π`, `θ`, `Δ`, `∞`).

- **🧰 Student & Developer Toolbox**:
  - **GPA & Final Exam Target Calculator**: Real-time required final exam score computer with course weighting.
  - **Unit & Base Converter**: Real-time conversions for Computer Science bases (Dec, Hex, Bin, Oct), Storage (KB, MB, GB, TB), and Temperature.
  - Offline Scientific Calculator (`sin`, `cos`, `tan`, `log`, `sqrt`).
  - Offline QR Code Studio.

- **📱 PWA & Desktop Installable**:
  - Installable via Chrome, Edge, Brave as a native standalone window.
  - Offline caching via dedicated Service Worker.

- **🔒 Local-First & 100% Private**:
  - Zero login required. All data stays on your machine.
  - 1-click local JSON backup export and restore.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/your-username/cadence.git
cd cadence

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
```

---

## 📁 Project Structure

```
├── app-blueprint/             # Architecture specs & design documentation
├── src/
│   ├── components/            # UI modules & workspace views
│   │   ├── Sidebar.tsx        # Navigation sidebar & controls
│   │   ├── HabitModule.tsx    # Habit Loop & daily progress ring
│   │   ├── TimetableModule.tsx# 24h timeline & .ics exporter
│   │   ├── FocusModule.tsx    # Pomodoro & ambient sound generator
│   │   ├── KanbanModule.tsx   # Task & assignment board
│   │   ├── NotesModule.tsx    # Markdown notes scratchpad
│   │   └── UtilityModule.tsx  # Calculator, QR studio & JSON tools
│   ├── storage/
│   │   └── storageAdapter.ts  # Local-first storage & backup engine
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces & domain models
│   ├── utils/
│   │   ├── sound.ts           # Web Audio API sound synthesizer
│   │   └── icsExport.ts       # RFC 5545 iCalendar (.ics) generator
│   ├── index.css              # Obsidian dark theme & design tokens
│   ├── App.tsx                # Shell router & viewport
│   └── main.tsx               # Application entry point
├── package.json
└── vite.config.ts
```

---

## 📜 License
MIT License. Free and open source for everyone.
