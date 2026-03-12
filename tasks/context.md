# Context: FairGame

## What This Project Does
FairGame is a badminton club management platform that intelligently organizes players, courts, and games during club sessions. It uses smart pairing and opponent-selection algorithms to ensure every player gets equal, competitive game time.

## Current System State
- **Last updated:** 2026-03-12
- **Overall status:** Core feature loop complete and working
- **Tests passing:** Core algorithm tests implemented
- **Last known-good state:** npm run build passes, npm run dev works on port 3000, full session flow operational

## Architecture Overview
- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Prisma ORM
- **Database:** PostgreSQL (Railway)
- **Auth:** NextAuth.js with Google OAuth
- **PWA:** Service worker + manifest configured
- **Algorithms:** ELO-based rating system, multiple pairing strategies

## Core Feature Loop (COMPLETE)
1. User signs in via Google OAuth
2. Creates a club → `/club/create`
3. Creates a session → `/club/:id/sessions/new`
4. Sets up players → `/session/:id/setup` (add members + guests, toggle availability)
5. Starts session → live court view at `/session/:id`
6. Admin generates rounds using pairing algorithms (EQUAL_WEIGHT, RANDOM, PER_GAME)
7. Admin enters scores via modal → ELO ratings update automatically
8. Session ends

## API Surface (Complete)
- `GET/POST /api/clubs`
- `GET/PATCH /api/clubs/:id`
- `GET/POST /api/clubs/:id/members`
- `PATCH/DELETE /api/clubs/:id/members/:userId`
- `GET/POST /api/clubs/:id/sessions`
- `GET /api/clubs/:id/past-guests` (distinct guest names/emails with session counts)
- `GET/PATCH /api/sessions/:id` (status, name, algorithms, scoring)
- `GET/POST /api/sessions/:id/players` (supports guestEmail + auto-link)
- `PATCH/DELETE /api/sessions/:id/players/:playerId`
- `GET/POST /api/sessions/:id/games`
- `POST /api/sessions/:id/games/:gameId/scores`
- `GET/PATCH /api/user` (profile, theme)

## Active Work
Core loop + club management + settings/themes + responsive design + player management UX complete. Next priorities:
- Analytics & standings pages (use existing PlayerProfile ratings)
- Gemini AI integration for recommendations
- Stripe payment integration

## Known Issues / Gaps
- Icon files (icon-192.png, icon-512.png) not yet created for PWA
- Service worker not registered in app
- Singles game support not yet wired into game generation (always DOUBLES)
- No WebSocket real-time updates (manual refresh on session page)
- /club/:id/seasons page not yet built

## External Dependencies / Services
- Google OAuth configured (NextAuth.js)
- Gemini API key configured but not integrated
- Stripe keys pending configuration
- Railway PostgreSQL live and operational
