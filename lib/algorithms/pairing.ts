import { PairingAlgorithm, OpponentAlgorithm, PlayerClass } from '@prisma/client'

export interface Player {
  id: string
  name: string
  rating: number
  class: PlayerClass
  gamesPlayed: number
  lastGameEndedAt: number | null
  recentPartnerIds: string[]
  recentOpponentIds: string[]
}

export interface Pair {
  player1: Player
  player2: Player
  combinedRating: number
}

export interface Match {
  teamA: Pair
  teamB: Pair
  courtNumber: number
}

function makePair(p1: Player, p2: Player): Pair {
  return {
    player1: p1,
    player2: p2,
    combinedRating: p1.rating + p2.rating,
  }
}

function pairSequentially(players: Player[]): Pair[] {
  const pairs: Pair[] = []
  for (let i = 0; i < players.length - 1; i += 2) {
    pairs.push(makePair(players[i], players[i + 1]))
  }
  return pairs
}

function repeatPartnerScore(pairs: Pair[]): number {
  let score = 0
  for (const pair of pairs) {
    if (pair.player1.recentPartnerIds.includes(pair.player2.id)) score++
    if (pair.player2.recentPartnerIds.includes(pair.player1.id)) score++
  }
  return score
}

/**
 * RANDOM pairing — shuffle and pair sequentially.
 * History-aware: tries multiple shuffles and picks the arrangement
 * with the fewest repeat-partner matchups for maximum variety.
 */
function randomPairing(players: Player[]): Pair[] {
  const hasHistory = players.some(p => p.recentPartnerIds.length > 0)
  const MAX_ATTEMPTS = hasHistory ? 12 : 1

  let bestPairs: Pair[] = []
  let bestScore = Infinity

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const shuffled = shuffle(players)
    const pairs = pairSequentially(shuffled)
    const score = repeatPartnerScore(pairs)

    if (score < bestScore) {
      bestScore = score
      bestPairs = pairs
    }
    if (score === 0) break
  }

  return bestPairs
}

/**
 * EQUAL_WEIGHT (Balanced) pairing — strongest with weakest for even teams.
 * Adds ±20 rating jitter so the exact same pairs don't form every time
 * when players have similar ratings.
 */
function equalWeightPairing(players: Player[]): Pair[] {
  const withJitter = players.map(p => ({
    player: p,
    sortKey: p.rating + (Math.random() - 0.5) * 40,
  }))
  withJitter.sort((a, b) => b.sortKey - a.sortKey)

  const sorted = withJitter.map(w => w.player)
  const pairs: Pair[] = []
  const half = Math.floor(sorted.length / 2)

  for (let i = 0; i < half; i++) {
    pairs.push(makePair(sorted[i], sorted[sorted.length - 1 - i]))
  }

  return pairs
}

/**
 * LADDER pairing — sort by rating, pair adjacent players.
 * #1 with #2, #3 with #4, etc. Strong plays with strong, weak with weak.
 * This means the highest-rated available players form the first pair.
 */
function ladderPairing(players: Player[]): Pair[] {
  const sorted = [...players].sort((a, b) => b.rating - a.rating)
  return pairSequentially(sorted)
}

/**
 * PEG BOARD pairing — sort by wait time (longest-waiting first).
 * Players who haven't played recently get priority.
 * Pure FIFO fairness: whoever waited longest plays next.
 *
 * Sort order: null lastGameEndedAt (never played) first,
 * then lowest timestamp (longest wait) first.
 * Tie-break: fewer games played goes first.
 */
function pegPairing(players: Player[]): Pair[] {
  const sorted = [...players].sort((a, b) => {
    const aTime = a.lastGameEndedAt ?? 0
    const bTime = b.lastGameEndedAt ?? 0
    if (aTime !== bTime) return aTime - bTime
    return a.gamesPlayed - b.gamesPlayed
  })
  return pairSequentially(sorted)
}

// ---------------------------------------------------------------------------
// Public: generate pairs
// ---------------------------------------------------------------------------

export function generatePairs(
  players: Player[],
  algorithm: PairingAlgorithm
): Pair[] {
  if (players.length < 2) return []

  switch (algorithm) {
    case 'RANDOM':
    case 'PER_GAME':
      return randomPairing(players)
    case 'EQUAL_WEIGHT':
      return equalWeightPairing(players)
    case 'LADDER':
      return ladderPairing(players)
    case 'PEG':
      return pegPairing(players)
    case 'FIXED':
      throw new Error('FIXED pairing should be pre-configured')
    default:
      return randomPairing(players)
  }
}

// ---------------------------------------------------------------------------
// Opponent selection algorithms
// ---------------------------------------------------------------------------

function opponentRepeatScore(myPair: Pair, theirPair: Pair): number {
  const myPlayers = [myPair.player1, myPair.player2]
  const theirIds = [theirPair.player1.id, theirPair.player2.id]
  let score = 0
  for (const p of myPlayers) {
    for (const tid of theirIds) {
      if (p.recentOpponentIds.includes(tid)) score++
    }
  }
  return score
}

/**
 * RANDOM opponent — pick from available pairs.
 * History-aware: prefers pairs not recently faced.
 */
function randomOpponent(myPair: Pair, pairs: Pair[]): Pair {
  const hasHistory = myPair.player1.recentOpponentIds.length > 0 ||
    myPair.player2.recentOpponentIds.length > 0

  if (!hasHistory) {
    return pairs[Math.floor(Math.random() * pairs.length)]
  }

  const scored = pairs.map(pair => ({
    pair,
    repeat: opponentRepeatScore(myPair, pair),
  }))
  const minRepeat = Math.min(...scored.map(s => s.repeat))
  const best = scored.filter(s => s.repeat === minRepeat).map(s => s.pair)
  return best[Math.floor(Math.random() * best.length)]
}

/**
 * EQUAL_WEIGHT (Balanced) opponent — closest combined rating.
 * Tie-break: fewer recent opponent matchups preferred.
 */
function equalWeightOpponent(myPair: Pair, pairs: Pair[]): Pair {
  return pairs.reduce((best, pair) => {
    const curDiff = Math.abs(pair.combinedRating - myPair.combinedRating)
    const bestDiff = Math.abs(best.combinedRating - myPair.combinedRating)

    if (curDiff < bestDiff) return pair
    if (curDiff === bestDiff) {
      const curRepeat = opponentRepeatScore(myPair, pair)
      const bestRepeat = opponentRepeatScore(myPair, best)
      if (curRepeat < bestRepeat) return pair
    }
    return best
  })
}

/**
 * LADDER / PEG opponent — take the first available pair.
 * Since pairs come pre-sorted (by rating for LADDER, by wait time for PEG),
 * sequential matching ensures adjacent pairs play each other.
 */
function sequentialOpponent(pairs: Pair[]): Pair {
  return pairs[0]
}

/**
 * PLAY_WITHIN_CLASS — match pairs of the same player class.
 * Falls back to balanced matching if no same-class pairs available.
 */
function playWithinClassOpponent(
  myPair: Pair,
  pairs: Pair[],
  allPlayers: Player[]
): Pair {
  const myClass = getMajorityClass([myPair.player1, myPair.player2])
  const sameClassPairs = pairs.filter(pair => {
    const pairClass = getMajorityClass([pair.player1, pair.player2])
    return pairClass === myClass
  })

  if (sameClassPairs.length > 0) {
    return randomOpponent(myPair, sameClassPairs)
  }
  return equalWeightOpponent(myPair, pairs)
}

export function selectOpponents(
  pair: Pair,
  availablePairs: Pair[],
  algorithm: OpponentAlgorithm,
  players: Player[]
): Pair | null {
  if (availablePairs.length === 0) return null

  switch (algorithm) {
    case 'RANDOM':
      return randomOpponent(pair, availablePairs)
    case 'EQUAL_WEIGHT':
    case 'OPPONENT_WEIGHT':
      return equalWeightOpponent(pair, availablePairs)
    case 'LADDER':
    case 'PEG':
      return sequentialOpponent(availablePairs)
    case 'PLAY_WITHIN_CLASS':
      return playWithinClassOpponent(pair, availablePairs, players)
    default:
      return randomOpponent(pair, availablePairs)
  }
}

// ---------------------------------------------------------------------------
// Match generation
// ---------------------------------------------------------------------------

export function generateMatches(
  pairs: Pair[],
  courts: number,
  opponentAlgorithm: OpponentAlgorithm,
  players: Player[],
  maxMatches?: number
): Match[] {
  const matches: Match[] = []
  const usedPairs = new Set<string>()
  const limit = maxMatches ?? courts

  for (let i = 0; i < limit && pairs.length >= 2; i++) {
    const availablePairs = pairs.filter(
      p => !usedPairs.has(getPairId(p))
    )
    if (availablePairs.length < 2) break

    const pair1 = availablePairs[0]
    usedPairs.add(getPairId(pair1))

    const remainingPairs = availablePairs.filter(
      p => getPairId(p) !== getPairId(pair1)
    )

    const pair2 = selectOpponents(
      pair1,
      remainingPairs,
      opponentAlgorithm,
      players
    )

    if (pair2) {
      usedPairs.add(getPairId(pair2))
      matches.push({
        teamA: pair1,
        teamB: pair2,
        courtNumber: i + 1,
      })
    }
  }

  return matches
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMajorityClass(players: Player[]): PlayerClass {
  const classMap = new Map<PlayerClass, number>()
  players.forEach(player => {
    classMap.set(player.class, (classMap.get(player.class) || 0) + 1)
  })
  let majorityClass: PlayerClass = 'INTERMEDIATE'
  let maxCount = 0
  classMap.forEach((count, playerClass) => {
    if (count > maxCount) {
      maxCount = count
      majorityClass = playerClass
    }
  })
  return majorityClass
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getPairId(pair: Pair): string {
  const ids = [pair.player1.id, pair.player2.id].sort()
  return ids.join('-')
}
