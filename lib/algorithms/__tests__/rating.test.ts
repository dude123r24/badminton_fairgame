import {
  calculateNewRating,
  calculatePlayerClass,
  calculateTeamRating,
  updatePlayersRatings,
} from '../rating'
import { PlayerClass } from '@prisma/client'

describe('Rating System', () => {
  describe('calculateNewRating', () => {
    it('should increase rating after winning against equal opponent', () => {
      const newRating = calculateNewRating(
        1500,
        1500,
        1,
        'INTERMEDIATE' as PlayerClass
      )
      expect(newRating).toBeGreaterThan(1500)
    })

    it('should decrease rating after losing against equal opponent', () => {
      const newRating = calculateNewRating(
        1500,
        1500,
        0,
        'INTERMEDIATE' as PlayerClass
      )
      expect(newRating).toBeLessThan(1500)
    })

    it('should gain more points for beating higher rated opponent', () => {
      const gainAgainstEqual = calculateNewRating(
        1500,
        1500,
        1,
        'INTERMEDIATE' as PlayerClass
      )
      const gainAgainstHigher = calculateNewRating(
        1500,
        1700,
        1,
        'INTERMEDIATE' as PlayerClass
      )

      expect(gainAgainstHigher - 1500).toBeGreaterThan(gainAgainstEqual - 1500)
    })

    it('should not go below 0 rating', () => {
      const newRating = calculateNewRating(
        50,
        1800,
        0,
        'AMATEUR' as PlayerClass
      )
      expect(newRating).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculatePlayerClass', () => {
    it('should return INTERMEDIATE for players with few games', () => {
      const playerClass = calculatePlayerClass(1600, 3, 0.6)
      expect(playerClass).toBe('INTERMEDIATE')
    })

    it('should return ADVANCED for high rated players', () => {
      const playerClass = calculatePlayerClass(1750, 20, 0.6)
      expect(playerClass).toBe('ADVANCED')
    })

    it('should return AMATEUR for low rated players', () => {
      const playerClass = calculatePlayerClass(1100, 20, 0.4)
      expect(playerClass).toBe('AMATEUR')
    })

    it('should return INTERMEDIATE for mid-range players', () => {
      const playerClass = calculatePlayerClass(1400, 20, 0.5)
      expect(playerClass).toBe('INTERMEDIATE')
    })
  })

  describe('calculateTeamRating', () => {
    it('should return average of two player ratings', () => {
      const teamRating = calculateTeamRating(1600, 1400)
      expect(teamRating).toBe(1500)
    })

    it('should round to nearest integer', () => {
      const teamRating = calculateTeamRating(1601, 1400)
      expect(teamRating).toBe(1501)
    })
  })

  describe('updatePlayersRatings', () => {
    it('should update ratings for all players', () => {
      const winners = [
        { id: '1', rating: 1500, class: 'INTERMEDIATE' as PlayerClass },
        { id: '2', rating: 1500, class: 'INTERMEDIATE' as PlayerClass },
      ]
      const losers = [
        { id: '3', rating: 1500, class: 'INTERMEDIATE' as PlayerClass },
        { id: '4', rating: 1500, class: 'INTERMEDIATE' as PlayerClass },
      ]

      const updates = updatePlayersRatings(winners, losers)

      expect(updates).toHaveLength(4)
      expect(updates[0].newRating).toBeGreaterThan(updates[0].oldRating)
      expect(updates[2].newRating).toBeLessThan(updates[2].oldRating)
    })

    it('should calculate positive rating change for winners', () => {
      const winners = [
        { id: '1', rating: 1500, class: 'INTERMEDIATE' as PlayerClass },
      ]
      const losers = [
        { id: '2', rating: 1500, class: 'INTERMEDIATE' as PlayerClass },
      ]

      const updates = updatePlayersRatings(winners, losers)
      const winnerUpdate = updates.find((u) => u.playerId === '1')

      expect(winnerUpdate?.ratingChange).toBeGreaterThan(0)
    })
  })
})
