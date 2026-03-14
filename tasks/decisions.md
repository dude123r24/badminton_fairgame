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

[2026-03-12] DECISION: Rename game Session model to ClubSession
REASON: Avoid naming conflict with NextAuth's Session model which is required by PrismaAdapter
REJECTED: Renaming NextAuth Session — would break adapter compatibility

[2026-03-12] DECISION: Use database-based sessions for NextAuth (not JWT)
REASON: Better security, easier to revoke sessions, supports session data persistence
REJECTED: JWT sessions — harder to revoke, session data limited by token size

[2026-03-12] DECISION: Implement ELO-style rating with class-based K-factors
REASON: Standard approach in competitive gaming, K-factor adjustment prevents rating volatility for experienced players
REJECTED: Fixed K-factor — doesn't account for player experience; Win-only tracking — doesn't reflect skill accurately

[2026-03-12] DECISION: Implement multiple pairing algorithms (RANDOM, EQUAL_WEIGHT, FIXED, PER_GAME)
REASON: Different clubs have different preferences; flexibility is key for adoption
REJECTED: Single algorithm — too rigid for varied club needs

[2026-03-12] DECISION: Use Tailwind custom spacing based on 8px grid
REASON: Material 3 design system recommendation, ensures consistent spacing across UI
REJECTED: Default Tailwind spacing — doesn't align with design system requirements

[2026-03-12] DECISION: Use manual refresh pattern on live session page (not WebSockets)
REASON: Simpler, no infrastructure needed; WebSockets in backlog for future; sufficient for small club sessions
REJECTED: WebSockets — overkill for v1, adds deployment complexity; SSE — less battle-tested in Next.js App Router

[2026-03-12] DECISION: Game generation always creates DOUBLES games (4 players per game)
REASON: Core use case is doubles; singles support deferred to backlog
REJECTED: Supporting singles in v1 — adds significant branching complexity to pairing algorithm

[2026-03-12] DECISION: ELO rating updates applied immediately on score entry (not batch)
REASON: Simpler, ratings stay current throughout session, no batch job needed at this scale
REJECTED: Batch update at session end — would make mid-session ratings stale

[2026-03-12] DECISION: Guest email stored on SessionPlayer for future account linking
REASON: Allows stats to be preserved when guests later create accounts; auto-link on add if email already registered
REJECTED: Requiring guests to register first — too much friction for casual players

[2026-03-12] DECISION: Theme system uses CSS class on `<html>` element (light/dark/system)
REASON: Simple, no external dependency, works with Tailwind `dark:` modifier, user preference stored in DB
REJECTED: CSS-in-JS theming — overkill for light/dark toggle; separate CSS files — harder to maintain

[2026-03-12] DECISION: Club settings restricted to OWNER only; session settings to ADMIN+
REASON: Prevents admins from changing club-wide defaults; session-level overrides are operational decisions admins should control
REJECTED: Both accessible to admins — too permissive for club defaults

[2026-03-12] DECISION: Completed games use compact single-row layout instead of full card
REASON: Reduces visual noise, completed games are reference data not primary UI; saves significant vertical space with many games
REJECTED: Collapsible section — adds interaction cost; pagination — fragments the data

[2026-03-12] DECISION: Standings computed server-side from game history, not stored
REASON: No RatingHistory table in schema — stats derive from Game+GameSet+GamePlayer. Avoids denormalized counters that could drift.
REJECTED: Storing win/loss counters on PlayerProfile — extra mutation points, could go out of sync

[2026-03-12] DECISION: Standings page is club-scoped (/club/:id/standings), not global (/standings)
REASON: Ratings are per-club (PlayerProfile has clubId). A global standings page is meaningless without a club filter.
REJECTED: Global /standings page — confusing when a player is in multiple clubs with different ratings

[2026-03-13] DECISION: Replace PER_GAME/FIXED/OPPONENT_WEIGHT/PLAY_WITHIN_CLASS with 4 clear algorithms: RANDOM, EQUAL_WEIGHT (Balanced), LADDER, PEG (Board)
REASON: PER_GAME was just RANDOM, OPPONENT_WEIGHT was just EQUAL_WEIGHT — both placeholders. FIXED pairing threw errors. New LADDER (skill-proximity) and PEG (FIFO fairness) cover the two most requested badminton club modes. Old enum values kept in schema for backward compatibility.
REJECTED: Removing old enum values — would break existing sessions in the database

[2026-03-13] DECISION: Algorithms are history-aware with soft repeat avoidance
REASON: Without history, the same 4 players get paired together repeatedly in small groups. Soft avoidance (attempt one swap to break repeats, fall back gracefully) prevents staleness without breaking the algorithm's core intent. PEG uses no avoidance (pure FIFO is the point).
REJECTED: Hard constraint (never repeat) — impossible with small groups; scoring penalty system — over-engineered for the benefit

[2026-03-13] DECISION: GameAuditLog model for manual player swap tracking
REASON: Admin needs ability to manually swap players in active/queued games. All swaps must be audited (who swapped whom, when, by whom). Separate audit table keeps Game model clean while providing a full history trail.
REJECTED: Storing swap history as JSON on Game model — harder to query, no referential integrity; no audit — unacceptable for fairness transparency

[2026-03-13] DECISION: Store pairingAlgorithm and opponentAlgorithm on each Game
REASON: Each game should record which algorithms generated it, independent of session-level settings (which can be changed mid-session). Provides a per-game audit trail of algorithmic decisions.
REJECTED: Only storing at session level — misleading if algorithms are changed mid-session
