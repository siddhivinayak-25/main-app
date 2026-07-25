# hiresprint — Agentic Hiring Intelligence Platform

## Project Overview

hiresprint is an Agentic Hiring Intelligence platform. It evaluates how engineers collaborate with AI — candidates are dropped into a real sandboxed codebase and graded on orchestration quality, prompt efficiency, and AI recovery skills, not rote algorithm recall.

### Current State
- **Full stack live**: React + Vite frontend, Node.js + Express backend, Replit PostgreSQL, real Piston code execution, and a Gemini 2.5 Flash evaluation engine.
- Recruiter dashboard, test builder, invitation flow, candidate workspace, and candidate pipeline are all functional.
- Founder: Siddhivinayak Waghmode, COEP Technological University, BTech in Manufacturing Science & Technology.

### Stack
- **Frontend**: React 19, React Router 7, Vite 8, Tailwind CSS 4, Recharts, Lucide
- **Backend**: Node.js, Express, JWT auth, PostgreSQL, WebSocket (`ws`), LangChain + Gemini 2.5 Flash
- **Sandbox**: Piston API for isolated code execution (84 languages)
- **Editor / Terminal**: Monaco Editor, xterm.js

## How to Run

Two workflows are configured:
- **Start application**: `cd frontend && npm run dev` (port 5000)
- **Start Backend**: `cd backend && npm run dev` (port 3001)

## Project Structure

```
frontend/
  src/
    api/          # API clients (client.js, authService, testsService, etc.)
    components/   # Reusable UI components (auth, candidate, layout, ui, brand, visual)
    pages/        # Route-level pages
    hooks/        # Data fetching hooks
  public/         # Static assets (brand logos, topographic canvas image)

backend/
  src/
    db/           # PostgreSQL schema and pool
    routes/       # REST API routes
    evaluation/   # LangChain/Gemini evaluation engine
    websocket/    # WebSocket server for candidate terminal
```

## User Preferences

- Keep the light theme as the primary brand feel.
- Brand wordmark uses lowercase Inter, "hire" in purple and "sprint" in black.
- Founder section must stay on the landing page with LinkedIn, GitHub, and email links.
- No contact form on the landing page.
