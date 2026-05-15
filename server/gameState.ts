import type { Question, QuestionTiming } from "@shared/schema";

const MAX_TIME_PER_QUESTION: Record<string, number> = {
  easy: 120,
  medium: 60,
  expert: 30,
};

const MAX_WRONG_ANSWERS = 5;

export interface DerivedGameState {
  correctAnswers: number;
  wrongAnswers: number;
  totalTime: number;
  maxStreak: number;
  currentStreak: number;
  categoryPerformance: Record<string, { correct: number; wrong: number }>;
  totalQuestionsAnswered: number;
  accuracyRate: number;
  avgTimePerQuestion: number;
  gameOver: boolean;
}

/**
 * Pure function: given the timings array and the questions referenced by it,
 * recompute every denormalized scoring field. This is the single source of truth
 * for game state in the server-authoritative flow. Idempotent and replay-safe.
 *
 * Only timings with both `servedAt` AND `answeredAt` populated count as answered.
 */
export function deriveGameState(
  timings: QuestionTiming[],
  questionsById: Map<number, Question>,
  difficulty: string,
): DerivedGameState {
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let totalTime = 0;
  let maxStreak = 0;
  let currentStreak = 0;
  const categoryPerformance: Record<string, { correct: number; wrong: number }> = {};

  const maxTime = MAX_TIME_PER_QUESTION[difficulty] ?? 60;

  for (const timing of timings) {
    if (!timing || !timing.answeredAt) continue;

    const question = questionsById.get(timing.questionId);
    if (!question) continue;

    const isCorrect = timing.selectedAnswer !== null
      && timing.selectedAnswer === question.correctAnswer;

    const category = question.category ?? "Genel";
    if (!categoryPerformance[category]) {
      categoryPerformance[category] = { correct: 0, wrong: 0 };
    }

    if (isCorrect) {
      correctAnswers++;
      categoryPerformance[category].correct++;
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      wrongAnswers++;
      categoryPerformance[category].wrong++;
      currentStreak = 0;
    }

    const elapsedMs = Date.parse(timing.answeredAt) - Date.parse(timing.servedAt);
    const elapsedSec = Math.max(0, elapsedMs / 1000);
    totalTime += Math.min(elapsedSec, maxTime);
  }

  const totalQuestionsAnswered = correctAnswers + wrongAnswers;
  const accuracyRate = totalQuestionsAnswered > 0
    ? (correctAnswers / totalQuestionsAnswered) * 100
    : 0;
  const avgTimePerQuestion = totalQuestionsAnswered > 0
    ? totalTime / totalQuestionsAnswered
    : 0;

  return {
    correctAnswers,
    wrongAnswers,
    totalTime: Math.round(totalTime),
    maxStreak,
    currentStreak,
    categoryPerformance,
    totalQuestionsAnswered,
    accuracyRate,
    avgTimePerQuestion,
    gameOver: wrongAnswers >= MAX_WRONG_ANSWERS,
  };
}
