# hiresprint

**Agentic Hiring Intelligence Platform**

hiresprint evaluates how engineers think and build with AI agents, not just how they code. Recruiters create real-world, sandboxed technical assessments; candidates complete them in an AI-augmented IDE; and the platform returns a multi-dimensional, AI-generated evaluation with security and behavioral telemetry.

---

## Elevator Pitch

Traditional technical interviews reward algorithm memorization. Modern engineering is prompt engineering, orchestration, and debugging with AI. hiresprint closes that gap by giving candidates a real codebase, a real terminal, and an AI assistant—then scoring them on how effectively they collaborate with it.

---

## Inspiration

We kept seeing the same gap in technical hiring: interviews ask candidates to write functions from scratch in isolation, but day-to-day engineering now happens with AI pair programmers, sandboxed runtimes, and cloud-based tooling. The best engineers are not the ones who memorize syntax—they are the ones who can describe a problem clearly, recover when an AI model hallucinates, and keep a secure, productive workflow under pressure. We built hiresprint to make that real-world collaboration measurable.

## What it does

hiresprint is an end-to-end agentic hiring platform.

- Recruiters build custom technical assessments through a multi-step wizard.
- Each assessment defines a rubric, test cases, starter code, and a time limit.
- Candidates receive a unique invitation link and enter a browser-based IDE.
- Inside the workspace, candidates write code in Monaco, run it in a real terminal via xterm.js, and collaborate with an AI assistant panel.
- All execution is sandboxed through the Piston API.
- Security telemetry captures tab switching, focus loss, copy/paste events, and other integrity signals.
- A LangChain + Gemini 2.5 Flash engine scores the session across correctness, efficiency, prompt quality, error recovery, and code quality.
- Recruiters receive a structured report with scores, qualitative feedback, and security observations.

## How we built it

- **Frontend:** React 19, Vite 8, React Router 7, Tailwind CSS 4, Monaco Editor, xterm.js, Recharts, and Lucide React.
- **Backend:** Node.js, Express, PostgreSQL, JWT authentication, and the `ws` library for real-time terminal sessions.
- **AI Engine:** LangChain orchestrating Gemini 2.5 Flash for qualitative scoring and deterministic scorers for test-case validation.
- **Sandbox:** Piston API for isolated, multi-language code execution.
- **Security:** A frontend security monitor and backend logging pipeline for integrity events.
- **Design:** A light, professional UI with a custom SVG/text brand mark, topographic background, and founder section.

## Challenges we ran into

- **Real-time terminal synchronization:** Keeping xterm.js, the backend WebSocket, and Piston execution state in sync without losing candidate input or output.
- **Sandboxing without Docker:** Replit does not support containerization, so we used the Piston API to execute candidate code safely across languages.
- **LLM scoring consistency:** Designing a weighted rubric, confidence floor, and security penalty model that produces stable, explainable scores.
- **Secure but non-intrusive monitoring:** Capturing enough integrity signal to flag cheating without degrading the candidate experience.
- **Authentication for live sessions:** Ensuring invitation tokens are validated before WebSocket connections are accepted, with hard-close behavior on invalid tokens.

## Accomplishments that we're proud of

- A working, full-stack product with real AI evaluation and real sandboxed code execution—no mocks.
- A custom-built brand identity using only code (SVG/text logo) and a consistent light, gradient-heavy design system.
- A multi-dimensional scoring engine that combines deterministic correctness with LLM-driven qualitative assessment.
- End-to-end security telemetry that gives recruiters visibility without surveillance-level friction.
- A clean recruiter dashboard, test builder wizard, candidate pipeline, and AI-augmented workspace built from scratch.

## What we learned

- **AI evaluation needs structure.** Raw LLM scores are too noisy. Combining them with deterministic test cases and a weighted rubric makes results trustworthy.
- **Real-time systems are hard to debug.** Terminal sessions require careful connection lifecycle management, reconnection handling, and clean resource disposal.
- **Design is a product signal.** A consistent, professional UI builds recruiter confidence as much as the underlying engine does.
- **Schema migrations must be idempotent.** Using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` keeps boot-time setup safe and repeatable.
- **Git workflows matter.** Keeping feature branches clean and pushing through Replit’s git tooling avoids the token-auth friction of raw shell pushes.

## What's next for hiresprint

- Candidate welcome and landing page before entering a test.
- Recruiter session replay of candidate workspace activity.
- Detailed evaluation results page with full rubric breakdown.
- Email invitation delivery with magic links.
- OpenAI provider registration alongside Gemini.
- Admin oversight and role management.

---

## Why

- **AI is now a teammate.** Hiring should measure how candidates use it, not ignore it.
- **Rote coding problems are noisy.** They test recall, not real engineering judgment.
- **Cheating is harder to detect.** Take-home tests and screen-shared IDEs offer limited integrity signals.

hiresprint makes the assessment environment itself AI-native, integrity-aware, and observable.

---

## Who It Is For

| Role | Use Case |
|------|----------|
| **Recruiters / Hiring Managers** | Build role-specific tests, invite candidates, and review AI-generated performance reports. |
| **Candidates** | Complete a realistic, AI-assisted technical task in a browser-based IDE. |
| **Engineering Leaders** | Calibrate hiring rubrics and reduce bias with structured, multi-dimensional scoring. |

---

## How It Works

1. **Recruiter builds a test.** Define instructions, starter code, test cases, time limit, and evaluation rubric.
2. **Invite a candidate.** A unique invitation token grants access to a dedicated session.
3. **Candidate enters the workspace.** Monaco editor, xterm.js terminal, file tree, and an AI Panel are available.
4. **Code runs in a sandbox.** Submissions are executed remotely via the Piston API with isolated runtime.
5. **AI evaluates the session.** Gemini 2.5 Flash scores prompt quality, error recovery, and code quality; deterministic scorers grade output correctness and execution efficiency.
6. **Security telemetry is recorded.** Tab switching, focus loss, copy/paste, and other integrity events are logged with severity.
7. **Recruiter receives a report.** Weighted scores, qualitative feedback, and a recruiter-facing summary.

---

## Technical Architecture

### Frontend
- **React 19** with Vite 8
- **React Router 7** for routing
- **Tailwind CSS 4** for styling
- **Monaco Editor** for code editing
- **xterm.js** for the in-browser terminal
- **Recharts** for dashboards and metrics
- **Lucide React** for iconography

### Backend
- **Node.js** + **Express**
- **PostgreSQL** (Replit managed) for relational data
- **JWT** authentication
- **WebSocket** (`ws`) for real-time terminal synchronization and telemetry streaming
- **LangChain** + **Gemini 2.5 Flash** for LLM-based evaluation
- **Piston API** for isolated, multi-language code execution

### Data Flow

```
Recruiter UI  -->  REST API  -->  PostgreSQL
Candidate UI  -->  WebSocket  -->  Terminal / Telemetry
Candidate UI  -->  REST API  -->  Piston (sandbox execution)
Evaluation    -->  LangChain + Gemini  -->  Scored report
```

---

## Project Structure

```
frontend/
  src/
    api/            # API clients and service modules
    components/     # Reusable UI components (auth, candidate, layout, ui, brand, visual, wizard, workspace)
    pages/          # Route-level pages
    hooks/          # Data fetching and async hooks
    index.css       # Tailwind theme and custom tokens

backend/
  src/
    db/             # PostgreSQL pool and schema
    routes/         # REST API routes (auth, tests, candidates, invitations, sandbox, security)
    evaluation/     # LangChain/Gemini scoring engine
    websocket/      # WebSocket server for candidate sessions
    sandbox/        # Piston API client
```

---

## Database Schema

Key tables:

- `users` — Recruiter accounts, auth, and profile data.
- `tests` — Test definitions, instructions, starter code, and time limits.
- `test_cases` — Expected input/output pairs for deterministic validation.
- `candidates` — Candidate records and pipeline stage.
- `invitations` — Unique invitation tokens and session linkage.
- `evaluation_sessions` — Session snapshots, telemetry, and AI evaluation results.
- `security_events` — Integrity audit trail (tab switch, focus loss, copy/paste, etc.).

---

## AI Evaluation Engine

The evaluation engine runs a multi-dimensional scoring pipeline:

1. **Deterministic scorers**
   - `outputCorrectness` — passes test cases against expected output.
   - `executionEfficiency` — analyzes runtime telemetry.

2. **LLM scorers (Gemini 2.5 Flash)**
   - `promptQuality` — clarity and intent of candidate prompts.
   - `errorRecovery` — ability to recover from mistakes and AI failures.
   - `codeQuality` — correctness, structure, and readability.

3. **Aggregation**
   - Weighted average across rubric dimensions.
   - Confidence floor filtering.
   - Security penalties applied based on severity of logged events.

4. **Synthesis**
   - Final recruiter summary with highlights and concerns.

---

## Getting Started

### Prerequisites

- Node.js
- PostgreSQL database URL
- Gemini API key
- JWT secret

### Install Dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

### Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=<your_postgres_url>
JWT_SECRET=<your_jwt_secret>
GEMINI_API_KEY=<your_gemini_api_key>
```

### Run the Application

Two workflows are configured:

```bash
# Terminal 1 — backend (port 3001)
cd backend && npm run dev

# Terminal 2 — frontend (port 5000)
cd frontend && npm run dev
```

---

## Roadmap

Features still in progress or planned:

- Candidate welcome and landing page before entering a test
- Recruiter session replay of candidate workspace activity
- Detailed evaluation results page with rubric breakdown
- Email invitation delivery with magic links
- OpenAI provider registration alongside Gemini
- Admin oversight and role management

---

## Founder

hiresprint is built by **Siddhivinayak Waghmode**, BTech in Manufacturing Science & Technology from COEP Technological University.

---

## License

This is a proprietary project. All rights reserved.
