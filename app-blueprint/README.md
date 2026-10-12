# The Next-Gen Open-Source Productivity Suite & Hybrid SaaS
> Master Blueprint, Architecture Specification, and Execution Plan

---

## 🎯 Project Overview

This repository folder (`nirvaan-tools`) is your **personal sandbox and R&D lab** where features, workflows, and tools are tested and used daily.

This `app-blueprint/` directory contains all the specifications, architecture blueprints, data models, and step-by-step guides for building the **new, standalone, open-source app and hybrid SaaS** in a separate repository.

---

## 🧭 Product Identity & Vision

### What Is It?
An **all-in-one, local-first daily operating system** designed for **students, self-directed learners, and knowledge creators**.

### Core Philosophy
1. **Local-First & 100% Private**:
   - Zero required login to use all local tools.
   - Your schedule, notes, habits, and credentials live on your disk, never in a corporate silo.
2. **Subtle & Spacious Aesthetics**:
   - Inspired by **Linear**, **Notion**, and **Apple**.
   - Generous breathing room, distraction-free typography, and tasteful accent colors (Emerald for habits, Indigo for study, Amber for routines).
   - Zero neon noise, glowing particles, or artificial AI clutter.
3. **The Habit Loop & Routine Mechanics**:
   - Scientific productivity built around **Cue ➔ Routine ➔ Reward** (Atomic Habits / Duhigg).
   - Adaptive timetable with dynamic commute and study buffer calculations.
4. **Hybrid SaaS Architecture**:
   - Desktop-first application (Tauri / lightweight native webview).
   - Optional End-to-End Encrypted (E2EE) Cloud Sync SaaS for users who want multi-device sync across phone, tablet, and multiple laptops.

---

## 📁 Blueprint Documentation Files

| File | Description |
| :--- | :--- |
| [`01-ARCHITECTURE-AND-TECH-STACK.txt`](01-ARCHITECTURE-AND-TECH-STACK.txt) | Detailed technical stack, desktop framework comparisons, and hybrid cloud architecture. |
| [`02-FEATURES-AND-STUDENT-WORKFLOWS.txt`](02-FEATURES-AND-STUDENT-WORKFLOWS.txt) | In-depth breakdown of every tool (Habit Loop, Timetable, Focus, Kanban, Notes, Vault). |
| [`03-DATA-SCHEMA-AND-STORAGE.txt`](03-DATA-SCHEMA-AND-STORAGE.txt) | Complete SQLite / JSON data schemas, multi-profile models, and encryption specs. |
| [`04-STEP-BY-STEP-EXECUTION-GUIDE.txt`](04-STEP-BY-STEP-EXECUTION-GUIDE.txt) | Exact command-by-command instructions to initialize and build the new public repo. |

---

## 🗺️ High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DESKTOP CLIENT & WEB PWA                     │
│  Tauri (Rust) + TypeScript + React/Svelte/Vanilla • Offline 100%│
└────────────────────────────────┬────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       ┌──────────────────┐            ┌──────────────────┐
       │   PRODUCTIVITY   │            │  DEV & UTILITIES │
       ├──────────────────┤            ├──────────────────┤
       │ • Habit Loop     │            │ • Calculator     │
       │ • Timetable      │            │ • Converters     │
       │ • Focus Timer    │            │ • QR Studio      │
       │ • Markdown Notes │            │ • Text Diff/Hash │
       │ • Tasks / Kanban │            │ • Pass Vault     │
       └─────────┬────────┘            └─────────┬────────┘
                 │                               │
                 └───────────────┬───────────────┘
                                 │
                                 ▼
       ┌──────────────────────────────────────────────────┐
       │           LOCAL-FIRST STORAGE ADAPTER            │
       │   SQLite / IndexedDB • Zero Cloud Dependency     │
       └─────────────────────────┬────────────────────────┘
                                 │ (Optional Upgrade)
                                 ▼
       ┌──────────────────────────────────────────────────┐
       │          OPTIONAL E2EE CLOUD SYNC SAAS           │
       │   Supabase / Cloudflare Workers • Encrypted Sync │
       └──────────────────────────────────────────────────┘
```

---

## 🚀 Recommended Next Actions

1. Review the text files in this folder to verify all features and design requirements match your vision.
2. When ready, create the new standalone folder (e.g., `C:\Users\nirva\Downloads\cadence-app` or on GitHub) and follow [`04-STEP-BY-STEP-EXECUTION-GUIDE.txt`](04-STEP-BY-STEP-EXECUTION-GUIDE.txt) to scaffold the production app.
3. Keep `nirvaan-tools` as your active personal workspace to test new routine ideas and daily tools!
