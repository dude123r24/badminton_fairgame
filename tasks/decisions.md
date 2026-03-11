# Decision Log
<!-- Claude appends here after every non-trivial architectural or technical decision -->
<!-- Format:
[YYYY-MM-DD] DECISION: what was decided
REASON: why this over alternatives
REJECTED: what was considered and why discarded
-->

## Decisions

[2026-03-11] DECISION: Use Next.js 14 App Router as the framework
REASON: Best-in-class PWA support, built-in API routes, server components reduce client bundle
REJECTED: Vite+React — no built-in API layer; Remix — less ecosystem support for this stack

[2026-03-11] DECISION: Use Prisma ORM with PostgreSQL
REASON: Type-safe queries, great Railway integration, auto-migration support
REJECTED: Drizzle — less mature; raw SQL — too verbose for rapid development

[2026-03-11] DECISION: Use NextAuth.js for Google OAuth
REASON: Native Next.js integration, handles session management, supports multiple providers
REJECTED: Auth0 — adds cost; Clerk — vendor lock-in
