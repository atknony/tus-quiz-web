import type { Question, QuestionTiming } from "@shared/schema";

// --- Match score formula (per-game) ---------------------------------------

const BASE_PER_DIFFICULTY: Record<string, number> = {
  easy: 10,
  medium: 20,
  expert: 40,
};

const MAX_TIME_PER_QUESTION: Record<string, number> = {
  easy: 120,
  medium: 60,
  expert: 30,
};

const SPEED_BONUS_RATIO = 0.5;
const STREAK_STEP = 5;
const STREAK_BONUS_PER_STEP = 25;
const WRONG_PENALTY_RATIO = 0.3;

/**
 * Match score (higher = better). Pure function of the answered timings.
 *
 *   score = base × correct
 *         + Σ speedBonus(per correct answer, scaled by remaining time / max)
 *         + floor(maxStreak / 5) × 25
 *         − wrongAnswers × base × 0.3
 *
 * `base` is difficulty-tiered (Easy 10 / Medium 20 / Expert 40), giving Expert
 * games ~4× the headline weight before the speed/streak terms.
 */
export function computeMatchScore(
  timings: QuestionTiming[],
  questionsById: Map<number, Question>,
  difficulty: string,
  derived: { correctAnswers: number; wrongAnswers: number; maxStreak: number },
): number {
  const base = BASE_PER_DIFFICULTY[difficulty] ?? 10;
  const maxTime = MAX_TIME_PER_QUESTION[difficulty] ?? 60;

  let speedBonus = 0;
  for (const t of timings) {
    if (!t || !t.answeredAt || !t.selectedAnswer) continue;
    const q = questionsById.get(t.questionId);
    if (!q || t.selectedAnswer !== q.correctAnswer) continue;

    const elapsed = (Date.parse(t.answeredAt) - Date.parse(t.servedAt)) / 1000;
    const ratio = Math.max(0, (maxTime - elapsed) / maxTime);
    speedBonus += base * SPEED_BONUS_RATIO * ratio;
  }

  const streakBonus = Math.floor(derived.maxStreak / STREAK_STEP) * STREAK_BONUS_PER_STEP;
  const wrongPenalty = derived.wrongAnswers * base * WRONG_PENALTY_RATIO;

  return Math.max(0, Math.round(
    base * derived.correctAnswers + speedBonus + streakBonus - wrongPenalty,
  ));
}

// --- Rating formula (rolling window across multiple games) ----------------

const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  easy: 1.0,
  medium: 1.5,
  expert: 2.5,
};

const WINDOW = 30;
const DECAY_FACTOR = 0.92;

export interface RatedGame {
  score: number;
  difficulty: string;
  startedAt: Date | string;
}

/**
 * User rating: weighted average of match scores over the last 30 completed
 * games, weighted by 0.92^i (newest = i=0). Each game's contribution is also
 * multiplied by its difficulty tier so playing Expert is rewarded.
 *
 * A single lucky game contributes briefly then ages out — no permanent floor.
 * Recent improvement is rewarded within a few games.
 */
export function computeRating(games: RatedGame[]): number {
  if (games.length === 0) return 0;

  const sorted = [...games].sort((a, b) => {
    const aT = a.startedAt instanceof Date ? a.startedAt.getTime() : new Date(a.startedAt).getTime();
    const bT = b.startedAt instanceof Date ? b.startedAt.getTime() : new Date(b.startedAt).getTime();
    return bT - aT;
  });

  const window = sorted.slice(0, WINDOW);

  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < window.length; i++) {
    const weight = Math.pow(DECAY_FACTOR, i);
    const multiplier = DIFFICULTY_MULTIPLIER[window[i].difficulty] ?? 1.0;
    weightedSum += weight * window[i].score * multiplier;
    weightTotal += weight;
  }

  return Math.round(weightedSum / Math.max(weightTotal, 1));
}
