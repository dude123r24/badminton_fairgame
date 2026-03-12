import { PlayerClass } from '@prisma/client'

/**
 * ELO-style rating calculation
 * K-factor: 32 for new players, 24 for intermediate, 16 for advanced
 */
export function calculateNewRating(
  currentRating: number,
  opponentRating: number,
  actualScore: number, // 1 for win, 0 for loss
  playerClass: PlayerClass
): number {
  const kFactor = getKFactor(playerClass)
  const expectedScore = getExpectedScore(currentRating, opponentRating)
  const newRating = currentRating + kFactor * (actualScore - expectedScore)

  return Math.max(0, Math.round(newRating))
}

function getKFactor(playerClass: PlayerClass): number {
  switch (playerClass) {
    case 'AMATEUR':
      return 32
    case 'INTERMEDIATE':
      return 24
    case 'ADVANCED':
      return 16
    default:
      return 24
  }
}

function getExpectedScore(
  playerRating: number,
  opponentRating: number
): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
}

/**
 * Determine player class based on rating and games played
 */
export function calculatePlayerClass(
  rating: number,
  gamesPlayed: number,
  winRate: number
): PlayerClass {
  // Require minimum games before classification
  if (gamesPlayed < 5) {
    return 'INTERMEDIATE'
  }

  // Rating thresholds
  if (rating >= 1700 && winRate >= 0.55) {
    return 'ADVANCED'
  } else if (rating >= 1300 || (rating >= 1200 && winRate >= 0.5)) {
    return 'INTERMEDIATE'
  } else {
    return 'AMATEUR'
  }
}

/**
 * Calculate team rating for doubles pair
 */
export function calculateTeamRating(
  player1Rating: number,
  player2Rating: number
): number {
  return Math.round((player1Rating + player2Rating) / 2)
}

/**
 * Update player rating after a game
 */
export interface RatingUpdate {
  playerId: string
  oldRating: number
  newRating: number
  ratingChange: number
}

export function updatePlayersRatings(
  winners: Array<{ id: string; rating: number; class: PlayerClass }>,
  losers: Array<{ id: string; rating: number; class: PlayerClass }>
): RatingUpdate[] {
  const updates: RatingUpdate[] = []

  const winnersAvgRating =
    winners.reduce((sum, p) => sum + p.rating, 0) / winners.length
  const losersAvgRating =
    losers.reduce((sum, p) => sum + p.rating, 0) / losers.length

  // Update winners
  winners.forEach((player) => {
    const newRating = calculateNewRating(
      player.rating,
      losersAvgRating,
      1, // win
      player.class
    )
    updates.push({
      playerId: player.id,
      oldRating: player.rating,
      newRating,
      ratingChange: newRating - player.rating,
    })
  })

  // Update losers
  losers.forEach((player) => {
    const newRating = calculateNewRating(
      player.rating,
      winnersAvgRating,
      0, // loss
      player.class
    )
    updates.push({
      playerId: player.id,
      oldRating: player.rating,
      newRating,
      ratingChange: newRating - player.rating,
    })
  })

  return updates
}
