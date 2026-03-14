import { generatePairs, selectOpponents, generateMatches } from '../pairing'
import type { Player, Pair } from '../pairing'
import { PairingAlgorithm, OpponentAlgorithm, PlayerClass } from '@prisma/client'

function makePlayer(overrides: Partial<Player> & { id: string; name: string }): Player {
  return {
    rating: 1500,
    class: 'INTERMEDIATE' as PlayerClass,
    gamesPlayed: 0,
    lastGameEndedAt: null,
    recentPartnerIds: [],
    recentOpponentIds: [],
    ...overrides,
  }
}

const players8 = [
  makePlayer({ id: '1', name: 'P1', rating: 1800, class: 'ADVANCED' as PlayerClass, gamesPlayed: 20 }),
  makePlayer({ id: '2', name: 'P2', rating: 1200, class: 'AMATEUR' as PlayerClass, gamesPlayed: 10 }),
  makePlayer({ id: '3', name: 'P3', rating: 1600, class: 'INTERMEDIATE' as PlayerClass, gamesPlayed: 15 }),
  makePlayer({ id: '4', name: 'P4', rating: 1400, class: 'INTERMEDIATE' as PlayerClass, gamesPlayed: 12 }),
  makePlayer({ id: '5', name: 'P5', rating: 1700, class: 'ADVANCED' as PlayerClass, gamesPlayed: 18 }),
  makePlayer({ id: '6', name: 'P6', rating: 1300, class: 'AMATEUR' as PlayerClass, gamesPlayed: 8 }),
  makePlayer({ id: '7', name: 'P7', rating: 1550, class: 'INTERMEDIATE' as PlayerClass, gamesPlayed: 14 }),
  makePlayer({ id: '8', name: 'P8', rating: 1450, class: 'INTERMEDIATE' as PlayerClass, gamesPlayed: 11 }),
]

const players4 = players8.slice(0, 4)

describe('Pairing Algorithms', () => {
  describe('RANDOM pairing', () => {
    it('should pair all available players', () => {
      const pairs = generatePairs(players4, 'RANDOM' as PairingAlgorithm)
      expect(pairs).toHaveLength(2)
      const allIds = pairs.flatMap(p => [p.player1.id, p.player2.id])
      expect(new Set(allIds).size).toBe(4)
    })

    it('should produce different pairings across runs (non-deterministic)', () => {
      const results = new Set<string>()
      for (let i = 0; i < 20; i++) {
        const pairs = generatePairs(players8, 'RANDOM' as PairingAlgorithm)
        const key = pairs.map(p => `${p.player1.id}-${p.player2.id}`).join('|')
        results.add(key)
      }
      expect(results.size).toBeGreaterThan(1)
    })

    it('should avoid repeat partners when history is provided', () => {
      const playersWithHistory = players4.map(p =>
        p.id === '1' ? { ...p, recentPartnerIds: ['2', '2', '2'] } :
        p.id === '2' ? { ...p, recentPartnerIds: ['1', '1', '1'] } : p
      )
      let avoidedRepeat = 0
      for (let i = 0; i < 20; i++) {
        const pairs = generatePairs(playersWithHistory, 'RANDOM' as PairingAlgorithm)
        const p1Partner = pairs.find(p => p.player1.id === '1' || p.player2.id === '1')
        if (p1Partner) {
          const partnerId = p1Partner.player1.id === '1' ? p1Partner.player2.id : p1Partner.player1.id
          if (partnerId !== '2') avoidedRepeat++
        }
      }
      expect(avoidedRepeat).toBeGreaterThan(10)
    })

    it('should handle odd number of players (one sits out)', () => {
      const pairs = generatePairs(players8.slice(0, 5), 'RANDOM' as PairingAlgorithm)
      expect(pairs).toHaveLength(2)
    })
  })

  describe('EQUAL_WEIGHT (Balanced) pairing', () => {
    it('should pair strongest with weakest for balanced teams', () => {
      const pairs = generatePairs(players4, 'EQUAL_WEIGHT' as PairingAlgorithm)
      expect(pairs).toHaveLength(2)

      const ratingDiff = Math.abs(pairs[0].combinedRating - pairs[1].combinedRating)
      expect(ratingDiff).toBeLessThan(600)
    })

    it('should produce roughly equal combined ratings', () => {
      const pairs = generatePairs(players8, 'EQUAL_WEIGHT' as PairingAlgorithm)
      expect(pairs).toHaveLength(4)

      const ratings = pairs.map(p => p.combinedRating)
      const maxDiff = Math.max(...ratings) - Math.min(...ratings)
      expect(maxDiff).toBeLessThan(800)
    })
  })

  describe('LADDER pairing', () => {
    it('should pair adjacent-rated players together', () => {
      const pairs = generatePairs(players8, 'LADDER' as PairingAlgorithm)
      expect(pairs).toHaveLength(4)

      expect(pairs[0].player1.rating).toBeGreaterThanOrEqual(pairs[0].player2.rating)
      expect(pairs[0].player1.rating).toBeGreaterThanOrEqual(pairs[1].player1.rating)
    })

    it('should sort by rating descending before pairing', () => {
      const pairs = generatePairs(players4, 'LADDER' as PairingAlgorithm)
      expect(pairs).toHaveLength(2)

      const firstPairMinRating = Math.min(pairs[0].player1.rating, pairs[0].player2.rating)
      const secondPairMaxRating = Math.max(pairs[1].player1.rating, pairs[1].player2.rating)
      expect(firstPairMinRating).toBeGreaterThanOrEqual(secondPairMaxRating)
    })

    it('should have highest combined rating in first pair', () => {
      const pairs = generatePairs(players8, 'LADDER' as PairingAlgorithm)
      for (let i = 0; i < pairs.length - 1; i++) {
        expect(pairs[i].combinedRating).toBeGreaterThanOrEqual(pairs[i + 1].combinedRating)
      }
    })
  })

  describe('PEG BOARD pairing', () => {
    it('should prioritize players who waited longest', () => {
      const now = Date.now()
      const playersWithWait = [
        makePlayer({ id: 'a', name: 'Recent', rating: 1800, lastGameEndedAt: now - 60000 }),
        makePlayer({ id: 'b', name: 'Long Wait', rating: 1200, lastGameEndedAt: now - 600000 }),
        makePlayer({ id: 'c', name: 'Medium', rating: 1600, lastGameEndedAt: now - 300000 }),
        makePlayer({ id: 'd', name: 'Never Played', rating: 1400, lastGameEndedAt: null }),
      ]

      const pairs = generatePairs(playersWithWait, 'PEG' as PairingAlgorithm)
      expect(pairs).toHaveLength(2)

      const firstPairIds = [pairs[0].player1.id, pairs[0].player2.id]
      expect(firstPairIds).toContain('d')
      expect(firstPairIds).toContain('b')
    })

    it('should ignore skill level — pure FIFO', () => {
      const now = Date.now()
      const playersWithWait = [
        makePlayer({ id: 'a', name: 'Weak Old Wait', rating: 1000, lastGameEndedAt: now - 600000 }),
        makePlayer({ id: 'b', name: 'Strong Recent', rating: 2000, lastGameEndedAt: now - 60000 }),
        makePlayer({ id: 'c', name: 'Medium Old', rating: 1500, lastGameEndedAt: now - 500000 }),
        makePlayer({ id: 'd', name: 'Medium Recent', rating: 1500, lastGameEndedAt: now - 120000 }),
      ]

      const pairs = generatePairs(playersWithWait, 'PEG' as PairingAlgorithm)
      const firstPairIds = [pairs[0].player1.id, pairs[0].player2.id]
      expect(firstPairIds).toContain('a')
      expect(firstPairIds).toContain('c')
    })

    it('should break ties by fewer games played', () => {
      const now = Date.now()
      const playersWithSameWait = [
        makePlayer({ id: 'a', name: 'Few Games', lastGameEndedAt: now - 300000, gamesPlayed: 2 }),
        makePlayer({ id: 'b', name: 'Many Games', lastGameEndedAt: now - 300000, gamesPlayed: 8 }),
        makePlayer({ id: 'c', name: 'Mid Games', lastGameEndedAt: now - 300000, gamesPlayed: 5 }),
        makePlayer({ id: 'd', name: 'No Games', lastGameEndedAt: now - 300000, gamesPlayed: 0 }),
      ]

      const pairs = generatePairs(playersWithSameWait, 'PEG' as PairingAlgorithm)
      const firstPairIds = [pairs[0].player1.id, pairs[0].player2.id]
      expect(firstPairIds).toContain('d')
      expect(firstPairIds).toContain('a')
    })
  })
})

describe('Opponent Selection Algorithms', () => {
  function makePair(p1: Player, p2: Player): Pair {
    return { player1: p1, player2: p2, combinedRating: p1.rating + p2.rating }
  }

  const pairA = makePair(players8[0], players8[1])
  const pairB = makePair(players8[2], players8[3])
  const pairC = makePair(players8[4], players8[5])
  const pairD = makePair(players8[6], players8[7])

  describe('RANDOM opponent', () => {
    it('should return an opponent from available pairs', () => {
      const opp = selectOpponents(pairA, [pairB, pairC, pairD], 'RANDOM' as OpponentAlgorithm, players8)
      expect(opp).not.toBeNull()
      expect([pairB, pairC, pairD]).toContainEqual(opp)
    })

    it('should prefer non-recent opponents', () => {
      const p1 = { ...players8[0], recentOpponentIds: [players8[2].id, players8[3].id] }
      const p2 = { ...players8[1], recentOpponentIds: [players8[2].id, players8[3].id] }
      const myPair = makePair(p1, p2)

      let avoidedRecent = 0
      for (let i = 0; i < 20; i++) {
        const opp = selectOpponents(myPair, [pairB, pairC, pairD], 'RANDOM' as OpponentAlgorithm, players8)
        if (opp && opp !== pairB) avoidedRecent++
      }
      expect(avoidedRecent).toBeGreaterThan(10)
    })
  })

  describe('EQUAL_WEIGHT (Balanced) opponent', () => {
    it('should pick closest combined rating', () => {
      const opp = selectOpponents(pairA, [pairB, pairC, pairD], 'EQUAL_WEIGHT' as OpponentAlgorithm, players8)
      expect(opp).not.toBeNull()

      const oppDiff = Math.abs(opp!.combinedRating - pairA.combinedRating)
      for (const other of [pairB, pairC, pairD]) {
        if (other !== opp) {
          expect(oppDiff).toBeLessThanOrEqual(Math.abs(other.combinedRating - pairA.combinedRating))
        }
      }
    })
  })

  describe('LADDER opponent (sequential)', () => {
    it('should return the first available pair', () => {
      const opp = selectOpponents(pairA, [pairB, pairC, pairD], 'LADDER' as OpponentAlgorithm, players8)
      expect(opp).toBe(pairB)
    })
  })

  describe('PEG opponent (sequential)', () => {
    it('should return the first available pair', () => {
      const opp = selectOpponents(pairA, [pairC, pairD, pairB], 'PEG' as OpponentAlgorithm, players8)
      expect(opp).toBe(pairC)
    })
  })
})

describe('generateMatches', () => {
  it('should generate correct number of matches', () => {
    const pairs = generatePairs(players8, 'RANDOM' as PairingAlgorithm)
    const matches = generateMatches(pairs, 2, 'RANDOM' as OpponentAlgorithm, players8)
    expect(matches.length).toBeLessThanOrEqual(2)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('should respect maxMatches parameter', () => {
    const pairs = generatePairs(players8, 'RANDOM' as PairingAlgorithm)
    const matches = generateMatches(pairs, 4, 'RANDOM' as OpponentAlgorithm, players8, 1)
    expect(matches).toHaveLength(1)
  })

  it('should not reuse players across matches', () => {
    const pairs = generatePairs(players8, 'RANDOM' as PairingAlgorithm)
    const matches = generateMatches(pairs, 2, 'RANDOM' as OpponentAlgorithm, players8)

    const usedIds = new Set<string>()
    for (const match of matches) {
      const ids = [
        match.teamA.player1.id, match.teamA.player2.id,
        match.teamB.player1.id, match.teamB.player2.id,
      ]
      for (const id of ids) {
        expect(usedIds.has(id)).toBe(false)
        usedIds.add(id)
      }
    }
  })

  it('should not generate more matches than available pairs allow', () => {
    const pairs = generatePairs(players4, 'RANDOM' as PairingAlgorithm)
    const matches = generateMatches(pairs, 10, 'RANDOM' as OpponentAlgorithm, players4)
    expect(matches.length).toBeLessThanOrEqual(1)
  })

  it('should assign sequential court numbers', () => {
    const pairs = generatePairs(players8, 'RANDOM' as PairingAlgorithm)
    const matches = generateMatches(pairs, 2, 'RANDOM' as OpponentAlgorithm, players8)
    matches.forEach((m, i) => {
      expect(m.courtNumber).toBe(i + 1)
    })
  })

  it('should work with LADDER algorithm end-to-end', () => {
    const pairs = generatePairs(players8, 'LADDER' as PairingAlgorithm)
    const matches = generateMatches(pairs, 2, 'LADDER' as OpponentAlgorithm, players8, 1)
    expect(matches).toHaveLength(1)

    const match = matches[0]
    const allRatings = [
      match.teamA.player1.rating, match.teamA.player2.rating,
      match.teamB.player1.rating, match.teamB.player2.rating,
    ]
    const minRating = Math.min(...allRatings)
    expect(minRating).toBeGreaterThanOrEqual(1550)
  })

  it('should work with PEG algorithm end-to-end', () => {
    const now = Date.now()
    const playersWithWait = [
      makePlayer({ id: 'a', name: 'Long Wait', rating: 1200, lastGameEndedAt: now - 600000, gamesPlayed: 5 }),
      makePlayer({ id: 'b', name: 'Recent', rating: 1800, lastGameEndedAt: now - 60000, gamesPlayed: 5 }),
      makePlayer({ id: 'c', name: 'Medium', rating: 1500, lastGameEndedAt: now - 300000, gamesPlayed: 5 }),
      makePlayer({ id: 'd', name: 'Never', rating: 1400, lastGameEndedAt: null, gamesPlayed: 0 }),
      makePlayer({ id: 'e', name: 'Very Old', rating: 1600, lastGameEndedAt: now - 900000, gamesPlayed: 8 }),
      makePlayer({ id: 'f', name: 'Just Now', rating: 1100, lastGameEndedAt: now - 30000, gamesPlayed: 3 }),
    ]

    const pairs = generatePairs(playersWithWait, 'PEG' as PairingAlgorithm)
    const matches = generateMatches(pairs, 2, 'PEG' as OpponentAlgorithm, playersWithWait, 1)
    expect(matches).toHaveLength(1)

    const matchPlayerIds = [
      matches[0].teamA.player1.id, matches[0].teamA.player2.id,
      matches[0].teamB.player1.id, matches[0].teamB.player2.id,
    ]
    expect(matchPlayerIds).toContain('d')
    expect(matchPlayerIds).toContain('e')
    expect(matchPlayerIds).not.toContain('b')
    expect(matchPlayerIds).not.toContain('f')
  })
}
)
