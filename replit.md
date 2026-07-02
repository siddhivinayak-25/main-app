# HireOS — Agentic Hiring Intelligence Platform

## Project Overview

HireOS is the world's first Agentic Hiring Intelligence platform. It evaluates how engineers collaborate with AI — candidates are dropped into a real sandboxed codebase and graded on orchestration quality, prompt efficiency, and AI recovery skills, not rote algorithm recall.

### Current State
- **Frontend only** (React 19 + Vite 8 + Tailwind CSS 4) — all data is mocked in `frontend/src/api/client.js`
- No backend yet — the core backend engine (sandbox, LangGraph evaluator, REST API) is the next major build phase

### Stack
- **Frontend**: React 19, React Router 7, Vite 8, Tailwind CSS 4, Recharts, Lucide
- **Backend (planned)**: Node.js or Python API, LangGraph evaluation engine, sandboxed code execution

## How to Run

The dev server starts automatically via the **Start application** workflow:
```
cd frontend && npm run dev
```
Runs on port 5000. Hot-reload is enabled.

## Project Structure

```
frontend/
  src/
    api/          # API layer (currently mock; swap client.js for real fetch to connect backend)
    components/   # Reusable UI components (auth, candidate, layout, ui)
    pages/        # Route-level pages
  public/         # Static assets
```

## User Preferences

- Build the core backend engine as the top priority (sandbox + LangGraph evaluator + REST API)
- Frontend user journeys are mostly complete — backend will drive UI changes
- Goal: world-first Hiring Intelligence platform ready for 2040 recruitment
