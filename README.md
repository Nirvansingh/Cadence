# Cadence

> A fast, local-first daily planner and focus workspace designed for students and self-directed learners.

**Built by Nirvaan Singh • 15-year-old Full-Stack Engineer**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-informational)](package.json)
[![React](https://img.shields.io/badge/React-19-61dafb)](package.json)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff)](package.json)

---

## Philosophy

Most modern productivity tools are bloated electron wrappers weighed down by mandatory accounts, monthly subscriptions, telemetry, and synthetic AI hype.

Cadence was built on the opposite premise:
- **Local-first by default**: All your habits, schedules, tasks, and notes stay on your machine in local storage. Zero telemetry, zero mandatory login.
- **Offline procedural audio**: Synthesized brown noise, white noise, and rain built directly with the Web Audio API—zero MP3 downloads, zero bandwidth overhead.
- **Utilitarian design**: Obsidian-dark palette, generous typography hierarchy, micro-radii, and keyboard-first shortcuts (`Ctrl + K` / `Cmd + K`).
- **Calendar interoperability**: 1-click RFC 5545 standard `.ics` export that immediately syncs your timetable into Google Calendar, Apple Calendar, and Outlook.

---

## Core Modules

### 1. Daily Habits
- Daily habit checklist with spring-physics check interactions.
- Circular completion progress ring and streak counters.
- 7-day consistency heatmap strips (`M T W T F S S`).
- Expandable cue, routine, and reward triggers for every habit.

### 2. Timetable & Schedule
- 24-hour visual schedule with automatic free-time and transit buffer calculations.
- Day-by-day scheduler from Monday through Sunday.
- 1-click RFC 5545 `.ics` export file for native calendar import.

### 3. Study Timer & Offline Audio
- Pomodoro intervals (25m classic, 45m class block, 90m deep work) and split-lap stopwatch.
- Procedural Web Audio noise generator: Brown Noise, White Noise, and Rain soundscapes running 100% offline.
- Distraction-free full-screen Zen focus mode.

### 4. Assignment & Task Kanban
- Three-stage workflow: To Do, In Progress, and Completed.
- Priority indicators (Urgent, High, Medium, Low) and due-date countdowns.

### 5. Notes & STEM Scratchpad
- Lightweight Markdown editor with live preview and tag filtering.
- 1-click scientific symbol drawer (`²`, `³`, `√`, `∑`, `∫`, `±`, `π`, `θ`, `Δ`, `∞`).
- Common Math & Physics formula reference shortcuts.

### 6. Student & Engineering Tools
- **GPA & Final Target Calculator**: Calculates required final exam scores based on current grades and syllabus weighting.
- **CS Base Converter**: Live conversions between Decimal, Hexadecimal, Binary, and Octal with storage unit scaling (KB, MB, GB, TB).
- **Scientific Calculator**: Offline trigonometry and logarithm functions.
- **QR Studio**: Standalone offline QR code generator for links and text snippets.

### 7. Storage, Sync & Portability
- **100% Private**: Runs completely in your browser or desktop without an internet connection.
- **Data Ownership**: 1-click JSON backup export and restore.
- **Optional Multi-Device Cloud Sync**: Optional Supabase authentication and encrypted cloud sync for students moving between desktop and mobile.

---

## Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 8 + OxLint |
| **Styling** | Vanilla CSS Design Tokens (Custom dark theme, zero CSS framework bloat) |
| **Audio Synthesis** | Web Audio API (Oscillators, BufferNodes & BiquadFilters) |
| **Desktop Shell** | Tauri 2 (Rust) |
| **Calendar Spec** | RFC 5545 iCalendar (`.ics`) standard generator |
| **Storage** | Local-First Adapter (LocalStorage / IndexedDB with JSON backup) |
| **Cloud Sync** | Supabase (Optional multi-device sync) |

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/Nirvansingh/Cadence.git
cd Cadence

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build & Linting

```bash
# Verify TypeScript types and build production bundle
npm run build

# Run fast linter
npm run lint
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Global Command Palette & Quick Navigation |
| `Escape` | Close modals, command palette, or full-screen Zen mode |

---

## License

MIT License • Free and open source for everyone. Built with craft by Nirvaan Singh.
