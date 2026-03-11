## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

## Project Context
- **App name:** vibe-application-template
- **Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL
- **Package manager:** npm
- **Test framework:** Jest + Playwright for E2E
- **Formatter/Linter:** Prettier + ESLint
- **Auth:** Google OAuth via NextAuth.js
- **LLM:** Gemini API (google-generative-ai SDK), model: gemini-1.5-flash
- **Payments:** Stripe (stripe-js + webhook handler)
- **Deployment:** Railway (PostgreSQL addon included)
- **Version control:** GitHub
- **UI Principles:** Clean, minimal — Google Material 3 spacing, Apple SF-style typography, system fonts, 8px grid

---

## Session Startup Protocol
At the start of EVERY session, in this exact order:
1. Read `tasks/context.md` — current system state
2. Read `tasks/handoff.md` — where last session ended
3. Read `tasks/todo.md` — current plan
4. Read `tasks/decisions.md` — why the system is built this way
5. Read `tasks/lessons.md` — all known mistakes and rules
Only THEN begin work — never skip this checklist.

---

## Session Handoff Protocol
At the end of EVERY session OR when context window is ~75% full:
1. Update `tasks/handoff.md`:
   - Last completed step (specific: file, function, what was done)
   - Exact next action for a fresh Claude instance to continue without questions
   - Decisions made this session
   - Any blockers or open questions
   - Current state: does `npm run dev` work? Do tests pass?
2. Update `tasks/todo.md` — mark done items, add discovered tasks to Backlog
3. Update `tasks/context.md` if system state changed
4. Never leave the project in a broken state at handoff

---

## Decision Logging
After ANY non-trivial decision (library, architecture, naming, approach):
Append to `tasks/decisions.md`:
```
[YYYY-MM-DD] DECISION: what was decided
REASON: why this over alternatives
REJECTED: what was considered and why discarded
```
This is non-negotiable. Future sessions depend on this log.

---

## Scope Guardrails
- **Never** modify files outside current task scope — even obvious improvements
- **Never** add a dependency without listing it in the plan first
- **Never** rename files, move folders, or refactor architecture without explicit instruction
- Discovered bugs or improvements → log in `tasks/todo.md` under Backlog, do NOT fix now
- One active task at a time. Finish completely before moving on.

---

## Communication Rules
- Changes touching >3 files: write plan to `tasks/todo.md` and summarise before starting
- Ambiguous requirements: state your assumption explicitly, then proceed
- Genuinely blocked: state exactly what is blocked and what you need — one clear question only
- Never ask multiple questions at once
- Progress updates: one line — what you just did, what you're doing next

---

## Testing Standards
- Write or update tests for every non-trivial change
- Tests must pass before any task is marked complete
- If a test cannot be written, state why explicitly
- Prefer integration tests over unit tests for business logic
- Never delete a failing test — fix it or flag it

---

## Recovery Protocol
If something breaks mid-session:
1. STOP immediately — do not attempt multiple fixes in a row
2. Document in `tasks/handoff.md`: what broke, last known-good state, what was tried
3. Revert to last known-good state if possible (git stash or git checkout)
4. Re-plan from scratch using plan mode
5. Never push broken code to main

---

## Context Window Management
- At ~75% full: finish current atomic task, then run Session Handoff Protocol
- Do not start a new major task if context is near full
- Offload research and exploration to subagents to preserve main context
- If mid-task when context fills: write precise "resume from here" note to `tasks/handoff.md`
