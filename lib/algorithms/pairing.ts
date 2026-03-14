import { PairingAlgorithm, OpponentAlgorithm, PlayerClass } from '@prisma/client'

export interface Player {
  id: string
  name: string
  rating: number
  class: PlayerClass
  gamesPlayed: number
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

/**
 * Generate pairs from available players using the specified pairing algorithm
 */
export function generatePairs(
  players: Player[],
  algorithm: PairingAlgorithm
): Pair[] {
  const shuffled = [...players]

  switch (algorithm) {
    case 'RANDOM':
      return randomPairing(shuffled)

    case 'EQUAL_WEIGHT':
      return equalWeightPairing(shuffled)

    case 'FIXED':
      // Fixed pairing is handled at session setup level
      throw new Error('FIXED pairing should be pre-configured')

    case 'PER_GAME':
      return randomPairing(shuffled)

    default:
      return randomPairing(shuffled)
  }
}

/**
 * Random pairing - shuffle and pair
 */
function randomPairing(players: Player[]): Pair[] {
  const shuffled = shuffle(players)
  const pairs: Pair[] = []

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    pairs.push({
      player1: shuffled[i],
      player2: shuffled[i + 1],
      combinedRating: shuffled[i].rating + shuffled[i + 1].rating,
    })
  }

  return pairs
}

/**
 * Equal weight pairing - balance skill ratings across pairs
 */
function equalWeightPairing(players: Player[]): Pair[] {
  const sorted = [...players].sort((a, b) => b.rating - a.rating)
  const pairs: Pair[] = []

  // Pair highest with lowest, second highest with second lowest, etc.
  const half = Math.floor(sorted.length / 2)

  for (let i = 0; i < half; i++) {
    pairs.push({
      player1: sorted[i],
      player2: sorted[sorted.length - 1 - i],
      combinedRating: sorted[i].rating + sorted[sorted.length - 1 - i].rating,
    })
  }

  return pairs
}

/**
 * Select opponent pairs for a given pair
 */
export function selectOpponents(
  pair: Pair,
  availablePairs: Pair[],
  algorithm: OpponentAlgorithm,
  players: Player[]
): Pair | null {
  if (availablePairs.length === 0) return null

  switch (algorithm) {
    case 'RANDOM':
      return randomOpponent(availablePairs)

    case 'EQUAL_WEIGHT':
      return equalWeightOpponent(pair, availablePairs)

    case 'OPPONENT_WEIGHT':
      return opponentWeightOpponent(pair, availablePairs)

    case 'PLAY_WITHIN_CLASS':
      return playWithinClassOpponent(pair, availablePairs, players)

    default:
      return randomOpponent(availablePairs)
  }
}

function randomOpponent(pairs: Pair[]): Pair {
  return pairs[Math.floor(Math.random() * pairs.length)]
}

function equalWeightOpponent(myPair: Pair, pairs: Pair[]): Pair {
  // Find pair with closest combined rating
  return pairs.reduce((closest, pair) => {
    const currentDiff = Math.abs(pair.combinedRating - myPair.combinedRating)
    const closestDiff = Math.abs(
      closest.combinedRating - myPair.combinedRating
    )
    return currentDiff < closestDiff ? pair : closest
  })
}

function opponentWeightOpponent(myPair: Pair, pairs: Pair[]): Pair {
  // Similar to equal weight but considers individual player ratings
  return equalWeightOpponent(myPair, pairs)
}

function playWithinClassOpponent(
  myPair: Pair,
  pairs: Pair[],
  allPlayers: Player[]
): Pair {
  const myClass = getMajorityClass([myPair.player1, myPair.player2])

  const sameClassPairs = pairs.filter((pair) => {
    const pairClass = getMajorityClass([pair.player1, pair.player2])
    return pairClass === myClass
  })

  if (sameClassPairs.length > 0) {
    return randomOpponent(sameClassPairs)
  }

  // Fallback to equal weight if no same-class pairs
  return equalWeightOpponent(myPair, pairs)
}

function getMajorityClass(players: Player[]): PlayerClass {
  const classMap = new Map<PlayerClass, number>()

  players.forEach((player) => {
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

/**
 * Fisher-Yates shuffle
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Generate matches for a round
 */
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
      (p) => !usedPairs.has(getPairId(p))
    )

    if (availablePairs.length < 2) break

    const pair1 = availablePairs[0]
    usedPairs.add(getPairId(pair1))

    const remainingPairs = availablePairs.filter(
      (p) => getPairId(p) !== getPairId(pair1)
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

function getPairId(pair: Pair): string {
  const ids = [pair.player1.id, pair.player2.id].sort()
  return ids.join('-')
}
