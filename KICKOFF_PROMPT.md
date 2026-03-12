# Claude Code Kick-off Prompt
<!-- Copy and paste the block below into Claude Code to start building -->

---

```
Read claude.md fully, then read SPEC.md fully.

Then read all files in the tasks/ folder in this order:
1. tasks/context.md
2. tasks/handoff.md
3. tasks/todo.md
4. tasks/decisions.md
5. tasks/lessons.md

Your job is to build this PWA application from scratch, end to end,
following the spec exactly and the workflow rules in claude.md.

Build in this order:
1. Scaffold Next.js 14 project with TypeScript and Tailwind
2. Set up Prisma with PostgreSQL schema from the spec
3. Implement Google OAuth with NextAuth.js
4. Build all pages and UI components from the spec
5. Integrate Gemini API
6. Integrate Stripe payments
7. Add PWA manifest and service worker
8. Write core tests
9. Ensure `npm run dev` runs cleanly with no errors
10. Update tasks/context.md with final system state

At each step: write the plan to tasks/todo.md first,
then implement, then verify it works before moving on. Update the tasks/todo.md and tasks/handover.md with completed status where applicable.

Do not ask me questions unless you are completely blocked.
State your assumptions and proceed.
```

---

## Resume Prompt (if session ends mid-build)

```
Read claude.md, Then read all files in the tasks/ folder in this order:
1. tasks/context.md
2. tasks/handoff.md
3. tasks/todo.md
4. tasks/decisions.md
5. tasks/lessons.md

Your job is to Resume from exactly where you left off per tasks/handoff.md,
following the spec exactly and the workflow rules in claude.md.

Do not re-do completed work. Continue building.
At each step: write the plan to tasks/todo.md first,
then implement, then verify it works before moving on. Update the tasks/todo.md and tasks/handover.md with completed status where applicable.
Do not ask me questions unless you are completely blocked.
State your assumptions and proceed.
```
