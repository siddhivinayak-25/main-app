# hiresprint

**Agentic Hiring Intelligence Platform**

hiresprint evaluates how engineers think and build with AI agents, not just how they code. Recruiters create real-world, sandboxed technical assessments; candidates complete them in an AI-augmented IDE; and the platform returns a multi-dimensional, AI-generated evaluation with security and behavioral telemetry.

---

## Elevator Pitch

Traditional technical interviews reward algorithm memorization. Modern engineering is prompt engineering, orchestration, and debugging with AI. hiresprint closes that gap by giving candidates a real codebase, a real terminal, and an AI assistant—then scoring them on how effectively they collaborate with it.

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
