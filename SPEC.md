# Functional Specification: FairGame
<!-- Last updated: March 2026 -->

## What This App Does
FairGame is a badminton club management platform that intelligently organises players, courts, and games during club sessions so every player gets equal, competitive game time. It solves the classic club problem — too many players, too few courts, unfair matchups — by using smart pairing and opponent-selection algorithms. Club admins manage rosters and sessions; players simply show up, mark themselves available, and FairGame does the rest.

## Target Users

| User Type | Who They Are | What They Want |
|---|---|---|
| **Club Owner** | Runs the club, pays for the plan | Full control over settings, analytics, player ratings |
| **Club Admin** | Trusted organiser (e.g. coach, committee) | Start/manage sessions, set rosters, update scores |
| **Member Player** | Registered club member | See upcoming sessions, mark availability, check standings |
| **Guest Player** | One-off visitor | Join a session without full account setup |
| **Platform Admin** | FairGame staff | View platform analytics, manage feature requests |

---

## Core Features

### Feature 1: Session Management
- **What it does:** Allows admins to create, start, pause, and end club sessions. Sessions are nested inside seasons. Each session inherits club-level defaults but can be customised at start time or mid-session. A club can run **multiple concurrent sessions** (e.g. a junior session and an adult session on the same evening across different courts).
- **User flow:**
  1. Admin navigates to dashboard → sees upcoming scheduled sessions
  2. Admin taps "Start Session" → reviews/adjusts court count, game format, pairing algorithm, opponent algorithm, scoring system
  3. If another session for this club is already active → system shows confirmation dialog: "A session is already running. Start another session simultaneously?" → Admin confirms
  4. App auto-generates the first round of games across available courts using the configured format
  5. Players mark themselves available (tap "I'm In" button) — if multiple sessions are active, players choose which session they're joining
  6. Admin or any player enters scores when a game finishes
  7. App immediately recalculates next matchups
  8. Admin ends session → session summary saved to season record
- **Edge cases:**
  - Session started with fewer players than courts → only fill courts that can be used
  - Player marks unavailable mid-session → remove from rotation, redistribute
  - Score entered for wrong game → allow correction within 10 minutes, flagged after
  - Player tries to join two concurrent sessions → system warns and requires confirmation
  - Concurrent sessions share the same court numbering namespace at club level — admin assigns which courts each session uses at start time

---

### Feature 2: Game Format & Match Structure Configuration
- **What it does:** Allows clubs to configure the match format and pairing style used during sessions. Settings cascade from club → session → individual game, with each level able to override the one above.

#### 2a. Match Format (Pairing Style)

| Format | Key | Description |
|---|---|---|
| Fixed Pair | `FIXED_PAIR` | Partners stay together for the entire session/tournament |
| Rotating Partner | `ROTATING_PARTNER` | Pairs change every game; points recorded individually |
| Random Pair | `RANDOM_PAIR` | Partners randomly assigned per game (draw-style) |

#### 2b. Tournament Structure

| Structure | Key | Description |
|---|---|---|
| Round Robin | `ROUND_ROBIN` | Every pair plays every other pair; highest wins advance |
| Swiss System | `SWISS` | Fixed rounds, no elimination; matched by similar win/loss record each round |
| Single Elimination | `SINGLE_ELIM` | Lose once and you're out |
| Double Elimination | `DOUBLE_ELIM` | Must lose twice to be eliminated |
| Combo / Team Event | `COMBO` | Pairs represent a team; result is sum of wins across D1/D2/D3 etc. |
| Club Rotation (default) | `CLUB_ROTATION` | FairGame's default fair-play mode: all players rotate, equal game time guaranteed |

> **Default for most clubs:** `CLUB_ROTATION` — this is what the original pairing algorithm spec covers. The other structures are activated for tournament-style events.

#### 2c. Scoring System

| Scoring System | Key | Description |
|---|---|---|
| Rally Point (BWF Standard) | `RALLY_21` | Best of 3, each game to 21, point every rally |
| Rally Point with Setting | `RALLY_21_SETTING` | As above; at 20-20 play until 2-point lead; capped at 30-29 → 30 wins |
| Rally Point No Setting | `RALLY_21_NO_SETTING` | First to 21 wins outright, no deuce |
| Short Sets – 15 | `SHORT_15` | Each game to 15 (faster play, juniors/beginners) |
| Short Sets – 7 | `SHORT_7` | Each game to 7 (very quick rounds) |
| Custom Cap | `CUSTOM_CAP` | Admin sets target score (e.g. 25 or 30); first to reach it wins |
| Old Service-Over | `SERVICE_OVER_15` | Only serving side scores; games to 15 (legacy/casual use) |

#### 2d. Configuration Inheritance & Override Rules
- **Club level** → sets the default for all sessions and all games within this club
- **Session level** → inherits club defaults; admin can override at session start or mid-session
- **Game level** → individual game can have its own format if admin explicitly sets it (e.g. a finals game uses `SINGLE_ELIM` + `RALLY_21_SETTING` while the rest of the session uses `CLUB_ROTATION` + `SHORT_15`)
- Game-level overrides are flagged in analytics so results are interpreted correctly

- **User flow:**
  1. Club Owner sets default format, structure, and scoring in Club Settings
  2. Admin reviews/overrides at session setup screen
  3. Admin can tap a specific court card mid-session → "Change format for this game" → override for that game only
  4. Score entry UI adapts to the active scoring system (e.g. shows "Game 1 / Game 2 / Game 3" for best-of-3; shows single score field for custom cap)
- **Edge cases:**
  - `SWISS` or elimination structures require a defined player/pair list upfront → system enforces this before the session can start
  - `COMBO` / team events require teams to be pre-configured → available as session-setup step
  - Switching scoring system mid-session → applies to new games only; completed games retain their original format in records
  - `CUSTOM_CAP` with target score not set → defaults to 21

---

### Feature 3: Pairing & Opponent Selection Algorithms
- **What it does:** Determines who plays with whom (doubles pairing) and against whom (opponent selection). Can be set at club level or overridden per session. These algorithms apply when using `CLUB_ROTATION` match format.
- **Doubles Pairing Algorithms:**
  - `RANDOM` — Randomly pair available players each round
  - `EQUAL_WEIGHT` — Pair players to balance overall skill ratings
  - `FIXED` — Pairs are locked for the entire session (set at session start)
  - `PER_GAME` — New pairing generated before each game
- **Doubles Opponent Selection Algorithms:**
  - `RANDOM` — Random opponent selection from available players
  - `EQUAL_WEIGHT` — Opponents selected so combined team ratings are approximately equal
  - `OPPONENT_WEIGHT` — Opponents selected based on closest match to the pair's combined rating
  - `PLAY_WITHIN_CLASS` — Players matched against others in the same class tier (Amateur / Intermediate / Advanced)
- **User flow:**
  1. Club Owner sets default algorithms in Club Settings
  2. Admin can override when starting a session
  3. Admin can change algorithm mid-session if needed
  4. Algorithm runs automatically when a court becomes free and players are available
- **Edge cases:**
  - Not enough same-class players for `PLAY_WITHIN_CLASS` → fall back to `EQUAL_WEIGHT`
  - Only 2 players available → singles game triggered automatically

---

### Feature 4: Player Class & Rating System
- **What it does:** Tracks each player's competitive class (Amateur / Intermediate / Advanced). Class adjusts dynamically based on win percentage and the calibre of opponents beaten.
- **Rules:**
  - All new players start at **Intermediate**
  - Win % and opponent quality (ELO-inspired) adjust class over time
  - Club Owner or Admin can manually override a player's class at any time
  - Class history is stored and shown in player analytics
- **User flow:**
  1. Player joins club → assigned Intermediate class
  2. As games are played and scores entered, system recalculates rating after each game
  3. Class changes are logged and visible to the player
  4. Admin can override from Player Profile page
- **Edge cases:**
  - Guest players → assigned Intermediate by default; ratings not persisted after session unless they register
  - New player with known skill → admin sets class manually before first session

---

### Feature 5: Member & Guest Management
- **What it does:** Manages registered club members and ad-hoc guest players within a session.
- **User flow (Guest):**
  1. Admin adds a guest at session start or mid-session via "Add Guest" button
  2. Guest gets a temporary profile (name + optional phone/email)
  3. Guest is included in rotation like a regular player
  4. After session, admin can invite guest to register as a full member
- **User flow (Member):**
  1. Player registers via Google OAuth
  2. Requests to join a club (or is invited by admin)
  3. Admin approves membership
  4. Player appears in roster for future sessions
- **Edge cases:**
  - Guest plays multiple sessions → stats stored temporarily, merged on registration
  - Player banned or removed mid-season → historical data preserved, excluded from future sessions

---

### Feature 5: Standings & Analytics
- **What it does:** Displays performance data for players and pairs across different time windows.
- **Time windows:** Session | Season | Year | Lifetime
- **Player Analytics:**
  - Games played, wins, losses, win %
  - Games per session, average wait time
  - Class progression over time
  - Strongest/weakest opponents
- **Pair Analytics:**
  - Pair win %, games played together
  - Best/worst matchups
- **Club Analytics (Owner/Admin only):**
  - Court utilisation per session
  - Session attendance trends
  - Game type breakdown (singles vs doubles)
  - Season summary reports
- **User flow:**
  1. Player taps their profile → sees personal analytics dashboard
  2. Standings tab shows leaderboard (filterable by season/year/lifetime)
  3. Admin taps Club Analytics → full session/season breakdown
- **Edge cases:**
  - Season with only 1 session → analytics still displayed, noted as limited data
  - Player plays across multiple clubs → stats shown per-club, not aggregated (unless player opts in — future feature)

---

### Feature 6: Seasons & Scheduled Sessions
- **What it does:** Organises the club calendar. Seasons are date-bounded containers for multiple sessions. Regular weekly sessions can be scheduled and paused.
- **User flow:**
  1. Admin creates a Season (name, start date, end date)
  2. Admin creates a recurring weekly session template (day, time, default courts, default algorithms)
  3. Sessions auto-appear in the calendar within the season
  4. Admin can pause a recurring session (e.g. bank holidays)
  5. Sessions can also be created ad-hoc outside the recurring schedule
- **Edge cases:**
  - Season dates overlap → system warns, requires confirmation
  - Session created outside any season → stored as "Unassigned", can be assigned later

---

### Feature 8: In-Session Court View & Score Entry
- **What it does:** Live view of all courts during an active session. Anyone can enter a score when a game finishes. The score entry UI adapts dynamically to the active scoring system and match format.
- **Score entry UI by format:**
  - `RALLY_21` / `RALLY_21_SETTING` → 3-game score entry (e.g. 21–18, 19–21, 21–15); app tracks which games are done
  - `SHORT_15` / `SHORT_7` / `CUSTOM_CAP` → single score entry per game
  - `SERVICE_OVER_15` → single score entry, app labels it as legacy format
  - Best-of-3 formats → app shows "Game 1 ✅ Game 2 ✅ Game 3 →" progress indicator on the court card
- **User flow:**
  1. Dashboard shows a card per active court with current players, format badge, and live score
  2. When a game/set ends, any player taps the court card → enters score for that set
  3. For best-of-3: score entry repeats per set until match is decided
  4. System records result, updates ratings, and queues next match
  5. Waiting players list shows who's next up
- **Design:** Drag-and-drop to manually reassign players to courts if needed (admin only)
- **Edge cases:**
  - Two people enter a score simultaneously → first entry wins, second person sees confirmation prompt
  - Score entered as a draw → system prompts "Are you sure?" (badminton has no draws)
  - `RALLY_21_SETTING`: if score reaches 20-20, system adds a "deuce" indicator and expects scores above 21; if 29-29, forces winner at 30
  - Game format changed mid-match → only applies to next game, current game retains its format

---

### Feature 8: Player Availability ("I'm In")
- **What it does:** Players mark themselves available for selection before or during a session. Low-touch, one-tap action.
- **User flow:**
  1. Player opens app → sees active or upcoming session for their club
  2. Taps "I'm In" to join the rotation
  3. Name appears in the "Available Players" pool
  4. Player can tap "Sit Out" to temporarily remove themselves
- **Edge cases:**
  - Player marks in but doesn't show → admin can mark them absent
  - Player arrives late → can join rotation at any point

---

### Feature 9: Search
- **What it does:** Allows players to discover other players and clubs on the platform.
- **Search scope:**
  - Players: search by name (within your club by default; platform-wide optional)
  - Clubs: search by club name or location
- **Privacy:** Player profiles are visible to members of the same club by default. Platform-wide visibility is opt-in.

---

### Feature 10: Feature Requests & Voting
- **What it does:** All users can submit feature ideas, vote on others' suggestions, and track status.
- **Statuses:** `Under Review` | `Planned` | `In Progress` | `Shipped` | `Declined`
- **User flow:**
  1. User taps "Feature Requests" from the menu
  2. Submits a request (title + description)
  3. Other users upvote requests they want
  4. Platform Admin updates status and adds notes
  5. All users see the public roadmap
- **Edge cases:**
  - Duplicate requests → system suggests similar open requests before submission

---

## Pages / Screens

| Route | Description | Auth Required? | Roles |
|---|---|---|---|
| `/` | Landing page — product marketing, sign in CTA | No | Public |
| `/dashboard` | Live session view + upcoming sessions | Yes | All |
| `/session/:id` | Active session court view, score entry, player pool | Yes | All |
| `/session/:id/setup` | Start/configure a session | Yes | Owner, Admin |
| `/standings` | Player & pair leaderboard | Yes | All |
| `/analytics` | Player personal analytics | Yes | All |
| `/club/:id/analytics` | Club-level analytics | Yes | Owner, Admin |
| `/club/:id/settings` | Club settings (algorithms, courts, etc.) | Yes | Owner, Admin |
| `/club/:id/members` | Member roster management | Yes | Owner, Admin |
| `/club/:id/seasons` | Season and schedule management | Yes | Owner, Admin |
| `/profile/:id` | Player profile + rating history | Yes | All |
| `/search` | Search players and clubs | Yes | All |
| `/feature-requests` | Community feature requests + voting | Yes | All |
| `/admin` | Platform admin panel | Yes | Platform Admin |
| `/api/auth/[...nextauth]` | Auth handler | Auto | Auto |

---

## Data Models

### User
- id (auto)
- email
- name
- avatar (from Google)
- platformRole: `PLATFORM_ADMIN` | `USER`
- createdAt

### Club
- id (auto)
- name
- location
- ownerId (→ User)
- defaultCourts (int)
- defaultPairingAlgorithm: `RANDOM` | `EQUAL_WEIGHT` | `FIXED` | `PER_GAME`
- defaultOpponentAlgorithm: `RANDOM` | `EQUAL_WEIGHT` | `OPPONENT_WEIGHT` | `PLAY_WITHIN_CLASS`
- defaultMatchFormat: `FIXED_PAIR` | `ROTATING_PARTNER` | `RANDOM_PAIR` (pairing style)
- defaultTournamentStructure: `CLUB_ROTATION` | `ROUND_ROBIN` | `SWISS` | `SINGLE_ELIM` | `DOUBLE_ELIM` | `COMBO`
- defaultScoringSystem: `RALLY_21` | `RALLY_21_SETTING` | `RALLY_21_NO_SETTING` | `SHORT_15` | `SHORT_7` | `CUSTOM_CAP` | `SERVICE_OVER_15`
- defaultCustomCapScore (int, nullable — used when scoringSystem is `CUSTOM_CAP`)
- allowConcurrentSessions (bool, default: true)
- createdAt

### ClubMembership
- id (auto)
- userId (→ User)
- clubId (→ Club)
- role: `OWNER` | `ADMIN` | `MEMBER`
- status: `ACTIVE` | `SUSPENDED`
- joinedAt

### PlayerProfile
- id (auto)
- userId (→ User)
- clubId (→ Club)
- class: `AMATEUR` | `INTERMEDIATE` | `ADVANCED`
- rating (float, ELO-style)
- classOverriddenBy (→ User, nullable)
- classOverriddenAt (timestamp, nullable)

### Season
- id (auto)
- clubId (→ Club)
- name
- startDate
- endDate
- isActive (bool)

### RecurringSession
- id (auto)
- clubId (→ Club)
- seasonId (→ Season)
- dayOfWeek: `MON`–`SUN`
- startTime
- defaultCourts (int)
- isPaused (bool)

### Session
- id (auto)
- clubId (→ Club)
- seasonId (→ Season, nullable)
- recurringSessionId (→ RecurringSession, nullable)
- name (string, optional — useful when running concurrent sessions e.g. "Adults" / "Juniors")
- date
- status: `UPCOMING` | `ACTIVE` | `ENDED`
- courts (int)
- courtNumbers (int[], the specific court numbers assigned to this session — prevents overlap in concurrent sessions)
- pairingAlgorithm: `RANDOM` | `EQUAL_WEIGHT` | `FIXED` | `PER_GAME`
- opponentAlgorithm: `RANDOM` | `EQUAL_WEIGHT` | `OPPONENT_WEIGHT` | `PLAY_WITHIN_CLASS`
- pairingMode: `FIXED` | `PER_GAME`
- matchFormat: `FIXED_PAIR` | `ROTATING_PARTNER` | `RANDOM_PAIR`
- tournamentStructure: `CLUB_ROTATION` | `ROUND_ROBIN` | `SWISS` | `SINGLE_ELIM` | `DOUBLE_ELIM` | `COMBO`
- scoringSystem: `RALLY_21` | `RALLY_21_SETTING` | `RALLY_21_NO_SETTING` | `SHORT_15` | `SHORT_7` | `CUSTOM_CAP` | `SERVICE_OVER_15`
- customCapScore (int, nullable)
- createdBy (→ User)

### SessionPlayer
- id (auto)
- sessionId (→ Session)
- userId (→ User, nullable — null for guests)
- guestName (string, nullable)
- status: `AVAILABLE` | `SITTING_OUT` | `ABSENT`
- joinedAt

### Game
- id (auto)
- sessionId (→ Session)
- courtNumber (int)
- type: `SINGLES` | `DOUBLES`
- status: `IN_PROGRESS` | `COMPLETED`
- -- Format overrides (null = inherit from session) --
- scoringSystemOverride (nullable — if set, overrides session scoring for this game only)
- customCapScoreOverride (int, nullable)
- matchFormatOverride (nullable)
- tournamentStructureOverride (nullable)
- formatOverriddenBy (→ User, nullable)
- startedAt
- endedAt

### GameSet
- id (auto)
- gameId (→ Game)
- setNumber (int — 1, 2, or 3 for best-of-3 formats; always 1 for single-game formats)
- teamAScore (int)
- teamBScore (int)
- winner: `A` | `B`
- isDeuceApplied (bool — true when 20-20 rule triggered in RALLY_21_SETTING)
- enteredBy (→ User)
- enteredAt

### GamePlayer
- id (auto)
- gameId (→ Game)
- sessionPlayerId (→ SessionPlayer)
- team: `A` | `B`

### GameResult
> **Note:** Individual set scores are stored in `GameSet`. `GameResult` is a derived/computed view — winner is determined by counting sets won across all `GameSet` records for a game. No separate GameResult table is needed; this is calculated on read.

### GameFormatConfig (reference — used as embedded type in Club, Session, and Game)
> This is not a separate database table but a shared shape used across all three levels. When a field is `null` on Session or Game, the system walks up the chain: Game → Session → Club.

```
matchFormat:          FIXED_PAIR | ROTATING_PARTNER | RANDOM_PAIR
tournamentStructure:  CLUB_ROTATION | ROUND_ROBIN | SWISS | SINGLE_ELIM | DOUBLE_ELIM | COMBO
scoringSystem:        RALLY_21 | RALLY_21_SETTING | RALLY_21_NO_SETTING | SHORT_15 | SHORT_7 | CUSTOM_CAP | SERVICE_OVER_15
customCapScore:       int (nullable, required when scoringSystem = CUSTOM_CAP)
```


### FeatureRequest
- id (auto)
- submittedBy (→ User)
- title
- description
- status: `UNDER_REVIEW` | `PLANNED` | `IN_PROGRESS` | `SHIPPED` | `DECLINED`
- adminNotes
- createdAt

### FeatureVote
- id (auto)
- featureRequestId (→ FeatureRequest)
- userId (→ User)
- createdAt

---

## Google OAuth
- On first login: create User record (platformRole: USER), redirect to `/dashboard`
- On subsequent login: load existing user, redirect to `/dashboard`
- Store: session with userId and platformRole
- No email/password auth — Google OAuth only (keeps it low-friction)

---

## Stripe Integration
- **Product type:** Freemium — Free plan at launch, Pro plan reserved for future
- **Current launch plan:** All features free
- **Freemium gates (future):**
  - Free: Up to 1 club, up to 30 members, basic analytics
  - Pro (price TBD): Unlimited clubs/members, advanced analytics, priority support, custom branding
- **Stripe infrastructure:** Set up Stripe customer on signup (even for free users) to make future upgrades frictionless
- **Webhook events to handle:** `checkout.session.completed`, `customer.subscription.deleted`

---

## UI Design Notes
- **App name:** FairGame
- **Colour palette:** White background (`#FFFFFF`), neutral grays (`#F8FAFC`, `#64748B`), green accent (`#16A34A`) for active states and CTAs, amber (`#F59E0B`) for warnings
- **Font:** System font stack (SF Pro / Segoe UI / Roboto)
- **Design principles:**
  - iPad and mobile-first — all layouts optimised for touch
  - 8px spacing grid (Material 3)
  - Large tap targets (minimum 44px)
  - Cards for court views, drag-and-drop for court/player reassignment (admin only)
  - Minimal text, maximum iconography in session views
  - One-tap key actions: "I'm In", score entry, session start
- **Dark mode:** No (v1)
- **Responsive:** Yes — tablet (iPad) primary, mobile secondary, desktop supported

---

## PWA Requirements
- **App name:** FairGame
- **Short name:** FairGame
- **Theme colour:** `#16A34A`
- **Background colour:** `#FFFFFF`
- **Offline support:** Basic (view last session state; score entry queued and synced on reconnect)
- **Add to Home Screen:** Prompted after 2nd session attendance

---

## RBAC — Role-Based Access Control

| Action | Platform Admin | Club Owner | Club Admin | Member | Guest |
|---|---|---|---|---|---|
| View platform analytics | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage feature request status | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create/delete a club | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| Edit club settings | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage members/roles | ✅ | ✅ | ✅ | ❌ | ❌ |
| Start/end a session | ✅ | ✅ | ✅ | ❌ | ❌ |
| Start concurrent sessions | ✅ | ✅ | ✅ (with confirmation) | ❌ | ❌ |
| Override game format mid-session | ✅ | ✅ | ✅ | ❌ | ❌ |
| Override player class/rating | ✅ | ✅ | ✅ | ❌ | ❌ |
| Enter game scores | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mark availability ("I'm In") | ✅ | ✅ | ✅ | ✅ | ✅ (in-session) |
| View standings & analytics | ✅ | ✅ | ✅ | ✅ | ❌ |
| Submit/vote on feature requests | ✅ | ✅ | ✅ | ✅ | ❌ |
| Search players/clubs | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## Auth Rules
- **Public routes:** `/`, `/api/auth/[...nextauth]`
- **Protected routes:** Everything else
- **Redirect unauthenticated users to:** `/`
- **Session token stores:** userId, platformRole, active clubId (last visited)
