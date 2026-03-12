import { generatePairs, selectOpponents, generateMatches } from '../pairing'
import { PairingAlgorithm, OpponentAlgorithm, PlayerClass } from '@prisma/client'

const mockPlayers = [
  {
    id: '1',
    name: 'Player 1',
    rating: 1800,
    class: 'ADVANCED' as PlayerClass,
    gamesPlayed: 20,
  },
  {
    id: '2',
    name: 'Player 2',
    rating: 1200,
    class: 'AMATEUR' as PlayerClass,
    gamesPlayed: 10,
  },
  {
    id: '3',
    name: 'Player 3',
    rating: 1600,
    class: 'INTERMEDIATE' as PlayerClass,
    gamesPlayed: 15,
  },
  {
    id: '4',
    name: 'Player 4',
    rating: 1400,
    class: 'INTERMEDIATE' as PlayerClass,
    gamesPlayed: 12,
  },
]

describe('Pairing Algorithms', () => {
  describe('generatePairs', () => {
    it('should generate pairs using RANDOM algorithm', () => {
      const pairs = generatePairs(mockPlayers, 'RANDOM' as PairingAlgorithm)
      expect(pairs).toHaveLength(2)
      expect(pairs[0].player1).toBeDefined()
      expect(pairs[0].player2).toBeDefined()
    })

    it('should generate balanced pairs using EQUAL_WEIGHT algorithm', () => {
      const pairs = generatePairs(
        mockPlayers,
        'EQUAL_WEIGHT' as PairingAlgorithm
      )
      expect(pairs).toHaveLength(2)

      // Highest rated (1800) should be paired with lowest (1200)
      const pair1Combined = pairs[0].combinedRating
      const pair2Combined = pairs[1].combinedRating

      // The combined ratings should be similar
      expect(Math.abs(pair1Combined - pair2Combined)).toBeLessThan(400)
    })

    it('should throw error for FIXED algorithm', () => {
      expect(() =>
        generatePairs(mockPlayers, 'FIXED' as PairingAlgorithm)
      ).toThrow()
    })
  })

  describe('selectOpponents', () => {
    it('should select opponent using RANDOM algorithm', () => {
      const pairs = generatePairs(mockPlayers, 'RANDOM' as PairingAlgorithm)
      const opponent = selectOpponents(
        pairs[0],
        [pairs[1]],
        'RANDOM' as OpponentAlgorithm,
        mockPlayers
      )
      expect(opponent).toBeDefined()
    })

    it('should select balanced opponent using EQUAL_WEIGHT algorithm', () => {
      const pairs = generatePairs(
        mockPlayers,
        'EQUAL_WEIGHT' as PairingAlgorithm
      )
      const opponent = selectOpponents(
        pairs[0],
        [pairs[1]],
        'EQUAL_WEIGHT' as OpponentAlgorithm,
        mockPlayers
      )
      expect(opponent).toBeDefined()
    })
  })

  describe('generateMatches', () => {
    it('should generate correct number of matches for available courts', () => {
      const pairs = generatePairs(mockPlayers, 'RANDOM' as PairingAlgorithm)
      const matches = generateMatches(
        pairs,
        1,
        'RANDOM' as OpponentAlgorithm,
        mockPlayers
      )
      expect(matches).toHaveLength(1)
      expect(matches[0].courtNumber).toBe(1)
    })

    it('should not generate more matches than available pairs', () => {
      const pairs = generatePairs(mockPlayers, 'RANDOM' as PairingAlgorithm)
      const matches = generateMatches(
        pairs,
        10, // More courts than pairs
        'RANDOM' as OpponentAlgorithm,
        mockPlayers
      )
      expect(matches.length).toBeLessThanOrEqual(Math.floor(pairs.length / 2))
    })
  })
})
