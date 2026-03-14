# FairGame — Algorithm Reference

This document explains every pairing, opponent, and rating algorithm in plain language. It covers what each one does, when to use it, and how edge cases are handled.

---

## How a Game Gets Created

Every time the admin taps **"Next Game"**, this happens:

1. **Gather available players** — anyone marked "Available" who is not already on court or in the queue.
2. **Build session history** — for each player, look at every completed game in this session and record:
   - How many games they've played
   - When their last game ended (wait time)
   - Who they partnered with recently
   - Who they played against recently
3. **Form pairs** using the chosen **Pairing Algorithm** (decides who partners with whom).
4. **Match pairs** using the chosen **Opponent Algorithm** (decides which pair plays which pair).
5. **Assign to court** — if a court is free, the game starts immediately. If all courts are occupied, the game goes into the **"Up Next"** queue and auto-promotes when a court opens.

Only **one game** is created per button press. This gives the admin full control.

---

## Pairing Algorithms

These decide **who is your doubles partner**.

### Random

**In plain English:** Shuffle all the waiting players like a deck of cards, then pair them off in order: 1st with 2nd, 3rd with 4th, and so on.

**How it actually works:**
- Shuffle the player list (Fisher-Yates shuffle — fair and unbiased).
- Pair them sequentially: player[0] + player[1], player[2] + player[3], etc.
- **Variety boost:** If players have game history in this session, do up to 12 different shuffles. Score each shuffle by counting how many pairs are repeat partnerships from recent games. Keep the shuffle with the lowest repeat score. If a perfect zero-repeat shuffle is found, stop early.
- If no history exists yet (start of session), just do one shuffle.

**When to use it:** Casual sessions where you want maximum variety and don't care about balancing skill.

### Balanced (Equal Weight)

**In plain English:** Pair the strongest player with the weakest, the second-strongest with the second-weakest, and so on. Every team ends up with roughly the same total skill.

**How it actually works:**
- Take each player's ELO rating and add a small random jitter of ±20 points. This prevents the exact same pairings forming every time when players have similar ratings.
- Sort players by this jittered rating from highest to lowest.
- Pair the top of the list with the bottom: #1 + #last, #2 + #second-last, etc.
- The result: every pair has a similar combined rating.

**When to use it:** Competitive sessions where you want every game to be a close contest with evenly matched teams.

### Ladder

**In plain English:** Line everyone up by skill rating. The two best players pair together, the next two pair together, and so on. Strong plays with strong, weak plays with weak.

**How it actually works:**
- Sort all available players by their ELO rating from highest to lowest.
- Pair them sequentially: #1 + #2, #3 + #4, #5 + #6, etc.
- The highest-rated pair is always the first pair in the list. This matters for opponent matching (see Ladder opponent below).

**When to use it:** Sessions where you want skill-grouped play. Advanced players get challenging games; beginners aren't overwhelmed.

### Peg Board

**In plain English:** This is the traditional badminton club peg board system. Players who have been waiting the longest play next. No skill consideration — pure fairness of court time.

**How it actually works:**
- Sort all available players by how long they've been waiting:
  - Players who have **never played** in this session go first (null wait time = highest priority).
  - Then sort by `lastGameEndedAt` timestamp — the player whose last game ended earliest (longest ago) goes next.
  - **Tie-break:** If two players finished at the same time, the one who has played fewer total games goes first.
- Pair them sequentially from the top of this sorted list: the two longest-waiting players pair together, the next two pair together, etc.

**When to use it:** Social/casual sessions where equal court time matters more than competitive balance. This is how most real-world badminton clubs operate.

---

## Opponent Algorithms

These decide **which pair plays against which pair**. They run after pairs have been formed.

### Random

**In plain English:** Pick any available pair to be the opponent. If there's game history, prefer a pair you haven't played against recently.

**How it actually works:**
- If no history exists, pick a random pair from the available pool.
- If history exists, score every available pair by counting how many of their players appear in your recent opponents list. The pair with the lowest repeat score is preferred. If multiple pairs tie, randomly pick among them.

**When to use it:** Casual sessions. Pair with Random or Balanced pairing for maximum variety.

### Balanced (Equal Weight)

**In plain English:** Face the team whose total skill is closest to yours. Close games every time.

**How it actually works:**
- For each available opponent pair, calculate the absolute difference between their combined rating and your combined rating.
- Pick the pair with the smallest difference.
- **Tie-break:** If two pairs have the same rating difference, pick the one with fewer recent matchups against you (to add variety).

**When to use it:** Competitive sessions. Pair with Balanced pairing for the tightest possible matches.

### Ladder

**In plain English:** The pairs that are next to each other in the ranking play each other. The top two pairs play, the next two play, and so on.

**How it actually works:**
- Since the pairs come pre-sorted by rating (from Ladder pairing), the opponent is simply the next pair in the list.
- Pair #1 (highest rated) plays Pair #2, Pair #3 plays Pair #4, etc.
- No scoring or comparison needed — it's purely positional.

**When to use it:** Always use with Ladder pairing. Creates skill-bracketed games where the best play the best.

### Peg Board

**In plain English:** Same as Ladder opponent but based on queue position instead of rating. The first two pairs off the waiting list play each other.

**How it actually works:**
- Since the pairs come pre-sorted by wait time (from Peg pairing), the opponent is simply the next pair in the list.
- The two longest-waiting pairs face each other.
- No scoring or comparison needed — it's purely positional.

**When to use it:** Always use with Peg pairing. Keeps the FIFO fairness intact.

---

## Recommended Combinations

| Style | Pairing | Opponent | Result |
|-------|---------|----------|--------|
| **Casual social** | Random | Random | Maximum variety, every game is a surprise |
| **Competitive fair** | Balanced | Balanced | Even teams, close games, everyone challenged equally |
| **Skill brackets** | Ladder | Ladder | Top players play top players, beginners play beginners |
| **Club night (traditional)** | Peg Board | Peg Board | Pure rotation — whoever waited longest plays next |
| **Social but close** | Random | Balanced | Random partners but the opponent is skill-matched |
| **Fair time, good games** | Peg Board | Balanced | Court time is fair, but opponents are skill-matched |

You can mix and match any pairing with any opponent algorithm. The combinations above are just starting points.

---

## Rating System (ELO)

Ratings update automatically when a score is entered. The system uses a standard ELO formula adapted for doubles.

### How it works

1. **Team rating** = average of both partners' individual ratings.
2. **Expected score** = probability of winning based on the rating difference between teams. Uses the standard formula: `1 / (1 + 10^((opponentRating - yourRating) / 400))`.
3. **New rating** = `currentRating + K * (actualResult - expectedScore)` where `actualResult` is 1 for a win, 0 for a loss.
4. Each player's rating is updated individually using the opposing team's average rating.

### K-Factor (how much ratings change per game)

| Player Class | K-Factor | Effect |
|-------------|----------|--------|
| Amateur (< 5 games or rating < 1300) | 32 | Ratings move fast — quickly finds your true level |
| Intermediate | 24 | Moderate movement |
| Advanced (rating >= 1700, win rate >= 55%) | 16 | Ratings are stable — big shifts require consistent results |

### Player Classification

- Fewer than 5 games played: always **Intermediate** (not enough data to classify).
- Rating >= 1700 and win rate >= 55%: **Advanced**.
- Rating >= 1300, or rating >= 1200 with win rate >= 50%: **Intermediate**.
- Everything else: **Amateur**.

### What happens for "No Result" games

If a session ends or a game is cancelled without a score, it is recorded as "No Result." **No rating changes occur.** Both teams' ratings stay exactly where they were.

---

## Edge Cases

### Fewer than 4 available players
A doubles game needs exactly 4 players. If fewer than 4 are available (waiting + not on court + not sleeping), the "Next Game" button is disabled and shows a message. No game is generated.

### Odd number of available players
If there's an odd number (e.g., 5, 7, 9), the last player who doesn't fit into a pair simply stays in the waiting list. They get priority in the next game (especially under Peg Board, since they'll have the longest wait time).

### Only 4 players available
There's only one possible game: the 4 players form 2 pairs and play. The pairing algorithm still determines who partners with whom, but the opponent algorithm has no choice — there's only one other pair.

### All players have the same rating
- **Random:** Works normally — ratings don't matter.
- **Balanced:** Everyone has the same rating, so the ±20 jitter introduces slight randomness in who pairs with whom. Effectively becomes random.
- **Ladder:** All players are "equal rank," so the sort order is arbitrary (JavaScript's sort is not guaranteed stable for equal values). Effectively becomes random.
- **Peg Board:** Ratings are irrelevant. Wait time and games played are the only factors.

### New player joins mid-session
They start with no history (`gamesPlayed: 0`, `lastGameEndedAt: null`). Under Peg Board, they get **top priority** because null wait time is treated as "waited the longest." Under other algorithms, they're treated as a normal player with a 1500 default rating (if they have no club profile).

### Player "sleeping" (sitting out)
Sleeping players are excluded from the available pool entirely. They don't appear in any algorithm calculations. When they wake up, they re-enter the pool. Under Peg Board, their wait time still reflects when their last game ended, so they'll naturally get priority if they've been sleeping for a while.

### All courts occupied
The generated game goes into the **"Up Next" queue** with status QUEUED. When any court frees up (a game gets scored), the oldest queued game is automatically promoted to that court and starts.

### Repeat partners when only a few players exist
With very few players (e.g., 6), repeat partners are unavoidable. The Random algorithm handles this gracefully:
- It tries up to 12 different shuffles to minimize repeats.
- If it can't find a zero-repeat arrangement (because there aren't enough players), it picks the **least bad** option.
- It never blocks or fails — it always produces a valid pairing.

### Repeat opponents
The Random and Balanced opponent algorithms both track recent opponents and prefer matchups that haven't happened recently. With small groups, repeats are inevitable, but the algorithms minimize them as much as possible.

### Players with vastly different ratings
- **Balanced pairing** handles this best — it pairs the 1800-rated player with the 1200-rated player, making a ~1500 combined team.
- **Ladder pairing** keeps them separate — the 1800 plays with other high-rated players, the 1200 plays with other low-rated players.
- **The ELO system** naturally adjusts: if a low-rated player beats a high-rated team, they gain many more points than usual (high K-factor + large positive surprise). If the expected favorite wins, ratings barely move.

### Session ends with games still in progress
All in-progress and queued games are marked as "Completed" with no score (No Result). No rating changes occur. This is handled by the session end API.

---

## Legacy Algorithm Values

These enum values still exist in the database for backward compatibility but are no longer shown in the UI:

| Value | What it does now |
|-------|-----------------|
| `PER_GAME` (pairing) | Falls back to Random |
| `FIXED` (pairing) | Throws an error — was never implemented |
| `OPPONENT_WEIGHT` (opponent) | Falls back to Balanced |
| `PLAY_WITHIN_CLASS` (opponent) | Matches pairs of the same player class (Amateur vs Amateur, etc.). Falls back to Balanced if no same-class pairs available. |
