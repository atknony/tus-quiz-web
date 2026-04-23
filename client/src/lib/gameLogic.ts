import { Difficulty, GameState } from "./types";

/**
 * Get maximum time per question based on difficulty
 */
export function getMaxTime(difficulty: Difficulty | null): number {
  switch (difficulty) {
    case 'easy':
      return 120;
    case 'medium':
      return 60;
    case 'expert':
      return 30;
    default:
      return 60;
  }
}

/**
 * Penalty system removed as per requirements
 * Returns 0 for all difficulties
 */
export function getPenaltyTime(difficulty: Difficulty | null): number {
  // Always return 0 as penalty system is removed
  return 0;
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate final score (only total time without penalties)
 */
export function calculateFinalScore(state: GameState): number {
  // Removed penalty system as per requirements
  return state.totalTime;
}

/**
 * Calculate accuracy rate
 */
export function calculateAccuracyRate(state: GameState): string {
  const totalAnswered = state.correctAnswers + state.wrongAnswers;
  if (totalAnswered === 0) return '0%';
  
  const accuracyRate = (state.correctAnswers / totalAnswered) * 100;
  return `${accuracyRate.toFixed(1)}%`;
}

/**
 * Calculate average time per question
 */
export function calculateAvgTimePerQuestion(state: GameState): string {
  const totalAnswered = state.correctAnswers + state.wrongAnswers;
  if (totalAnswered === 0) return '00:00';
  
  const avgSeconds = state.totalTime / totalAnswered;
  return formatTime(avgSeconds);
}

/**
 * Get formatted penalty time
 */
export function getPenaltyTimeFormatted(state: GameState): string {
  const penaltySeconds = state.wrongAnswers * getPenaltyTime(state.difficulty);
  return formatTime(penaltySeconds);
}

/**
 * Get difficulty name with proper capitalization
 */
export function getDifficultyName(difficulty: Difficulty | null): string {
  switch (difficulty) {
    case 'easy':
      return 'Easy';
    case 'medium':
      return 'Medium';
    case 'expert':
      return 'Expert';
    default:
      return '';
  }
}

/**
 * Get difficulty color class
 */
export function getDifficultyColorClass(difficulty: Difficulty | null): string {
  switch (difficulty) {
    case 'easy':
      return 'blue';
    case 'medium':
      return 'amber';
    case 'expert':
      return 'red';
    default:
      return 'blue';
  }
}
