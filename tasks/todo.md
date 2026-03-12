# Todo

## Analytics & Standings (2026-03-12) ✅
- [x] `GET /api/clubs/:id/standings` — PlayerProfiles with computed stats (games, wins, win%), optional ?sessionId filter
- [x] `/club/:id/standings` page — podium for top 3, full leaderboard table (rank, avatar, class badge, rating, G, W, Win%), "you" highlight
- [x] Added 🏆 Standings link to `/club/:id/page.tsx` bottom bar (visible to all members)
- [x] `GET /api/players/:id/stats` — games, wins, sessions attended, top 10 opponents, optional ?clubId filter
- [x] tsc --noEmit: zero non-test errors

## UI/UX Improvements (2026-03-12) ✅
- [x] Player stats in waiting pool (games played + wait time)
- [x] Session creation form redesign (responsive cards, compact OptionCard)
- [x] Session page — 28-player density redesign (two-column layout, compact CourtCard, smart queue, collapsible completed)
- [x] Setup page — member toggle switches + guest search combobox with past guest history
- [x] Past guests API endpoint

### Task A: Compact completed games ✅
- [x] CompletedGameRow component — single-row layout
- [x] Replaced CourtCard grid in session page with compact rows

### Task B: Guest email capture ✅
- [x] Schema: guestEmail on SessionPlayer
- [x] API: accepts guestEmail, auto-links existing users
- [x] UI: name + email form on setup page

### Task C: Multi-court game scheduling ✅
- [x] Verified game generation fills all courts
- [x] Court status strip (occupied/free) on session page
- [x] Generate Round button shows free court count

### Task D: Multiple simultaneous sessions ✅
- [x] Verified concurrent sessions work (no blocking)
- [x] Dashboard shows all active sessions per club with quick-access cards

### Task E: Mobile/iPad responsive design ✅
- [x] Navbar: hamburger on mobile, full nav on md+
- [x] iOS safe area padding on all bottom bars
- [x] viewport-fit=cover meta tag
- [x] Score entry modal already handles mobile (bottom sheet) + tablet (centered)

### Task F: Settings pages with themes ✅
- [x] User.theme field in schema
- [x] GET/PATCH /api/user endpoint
- [x] /settings page: profile + theme picker (light/dark/system)
- [x] /session/:id/settings page: algo + scoring overrides (admin only)
- [x] Session PATCH API extended for algo/scoring changes
- [x] Club settings restricted to OWNER only
- [x] ThemeProvider + dark mode CSS variables
- [x] Settings gear on session page header, Settings link in navbar

## Completed ✅
- [x] Scaffold Next.js 14 with TypeScript and Tailwind
- [x] Set up Prisma schema with all data models from spec (17 models)
- [x] Generate Prisma client and test database connection
- [x] Implement Google OAuth with NextAuth.js
- [x] Build middleware for protected routes and RBAC
- [x] Create UI component library (Button, Card, Input, Navbar)
- [x] Build basic dashboard, standings, and feature requests pages
- [x] Add PWA manifest and service worker
- [x] Implement pairing algorithms (RANDOM, EQUAL_WEIGHT, PER_GAME)
- [x] Implement opponent selection algorithms (RANDOM, EQUAL_WEIGHT, OPPONENT_WEIGHT, PLAY_WITHIN_CLASS)
- [x] Implement ELO-based rating system with class-based K-factors
- [x] Write comprehensive tests for algorithms
- [x] Verify npm run dev runs cleanly on port 3000
- [x] Update tasks/context.md, tasks/handoff.md, tasks/decisions.md
- [x] Build Select + Modal UI components
- [x] Club API routes (GET/POST /api/clubs, GET/PATCH /api/clubs/:id, GET/POST /api/clubs/:id/members, GET/POST /api/clubs/:id/sessions)
- [x] Session API routes (GET/PATCH /api/sessions/:id, GET/POST players, PATCH/DELETE player/:id, POST games, POST games/:id/scores)
- [x] Score entry triggers ELO rating update via updatePlayersRatings()
- [x] Game generation uses generatePairs() + generateMatches() algorithms
- [x] /club/create page
- [x] /club/:id club home page (sessions list, member count)
- [x] /club/:id/sessions/new - session creation form (all algorithm/scoring options)
- [x] /session/:id/setup - player management before session start
- [x] /session/:id - live session page (court cards, waiting pool, score entry modal)
- [x] CourtCard + ScoreEntryModal components
- [x] Dashboard updated with clubs list + Create Club CTA
- [x] Fixed pre-existing permissions.ts type error blocking build
- [x] npm run build passes cleanly
- [x] UI Redesign: CourtCard (no text truncation, TeamRow), Session page (header card, stats, section headers), Dashboard (role badges, live ring, chevron), Navbar (glass blur, pill tabs), ScoreEntryModal (individual names), Layout (bg/text colors)

### Priority 2: Club Management (Remaining)
- [x] Build /club/:id/settings page (edit defaults, scoring, algorithms)
- [x] Build /club/:id/members page (full member management with role changes)
- [ ] Build /club/:id/seasons page (create/edit seasons)
- [x] PATCH+DELETE /api/clubs/:id/members/:userId - role update + remove member

### Priority 3: Analytics & Standings
- [x] Build /club/:id/standings page (podium + leaderboard table with filters)
- [x] GET /api/clubs/:id/standings route (computed stats from game history)
- [x] GET /api/players/:id/stats route (games, wins, opponents)
- [ ] Add ?sessionId filter UI to standings page (dropdown of past sessions)
- [ ] Build /analytics page (player personal analytics)
  - Games played, wins, losses, win %
  - Rating progression chart (blocked — no RatingHistory table)
  - Strongest/weakest opponents
- [ ] Build /club/:id/analytics (club analytics — attendance trends, court utilization)

### Priority 4: Advanced Features
- [ ] Integrate Gemini API for smart recommendations
  - Suggest optimal pairing algorithms based on session history
  - Recommend class adjustments
  - Session insights
- [ ] Stripe integration
  - Create Stripe customer on signup
  - Subscription management (future - all features currently free)
  - Webhook handlers
- [ ] Search functionality
  - Search players (within club / platform-wide)
  - Search clubs by name/location
- [ ] Feature requests system
  - Submit feature requests
  - Vote on requests
  - Platform admin status updates

### Priority 5: Polish & Production
- [ ] Generate PWA icon files (192x192, 512x512)
- [ ] Register service worker in app
- [ ] Add loading states and error handling throughout
- [ ] Implement optimistic UI updates
- [ ] Add E2E tests with Playwright
- [ ] Performance optimization
- [ ] Production deployment checklist

## Backlog / Nice-to-Have
- Drag-and-drop player/court reassignment
- Real-time score updates via WebSockets
- Player profile avatars
- Email notifications for sessions
- Dark mode
- Mobile app (React Native / PWA conversion)
- Tournament brackets view for SWISS/SINGLE_ELIM formats
- Export analytics to CSV/PDF
- Custom branding per club
