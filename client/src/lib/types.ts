export interface AuthUser {
  id: number;
  username: string;
  email: string;
  dateOfBirth: string;
  university: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  createdAt: string;
}

export type Difficulty = 'easy' | 'medium' | 'expert';
export type Section = 'klinik' | 'preklinik';
export type GameMode = 'practice' | 'competitive';
export type GameStatus = 'abandoned' | 'completed';

export interface CategoryStats { correct: number; wrong: number }
export type CategoryPerformance = Record<string, CategoryStats>;

export interface AnswerSubmittedPayload {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
  selectedAnswer: string | null;
  questionIndex: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalTime: number;
  score: number;
  maxStreak: number;
  currentStreak: number;
  categoryPerformance: CategoryPerformance;
  gameOver: boolean;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  category?: string;
  difficulty?: string;
}

export interface GameState {
  currentScreen: 'mode' | 'welcome' | 'game' | 'feedback' | 'result' | 'profile' | 'friends' | 'leaderboard';
  viewingUserId: number | null;
  mode: GameMode | null;
  gameId: number | null;
  section: Section | null;
  category: string | null;
  difficulty: Difficulty | null;
  questions: Question[];
  totalQuestions: number;
  currentQuestionIndex: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalTime: number;
  score: number;
  currentQuestionTime: number;
  selectedAnswer: string | null;
  isTimerRunning: boolean;
  feedbackTimeRemaining: number;
  gameOver: boolean;
  currentStreak: number;
  maxStreak: number;
  categoryPerformance: CategoryPerformance;
}

export type GameAction =
  | { type: 'SET_MODE'; payload: GameMode }
  | { type: 'SET_GAME_ID'; payload: number }
  | { type: 'SET_SECTION'; payload: Section }
  | { type: 'SET_CATEGORY'; payload: string | null }
  | { type: 'SET_DIFFICULTY'; payload: Difficulty }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'START_COMPETITIVE_GAME'; payload: { gameId: number; question: Question; totalQuestions: number } }
  | { type: 'APPEND_QUESTION'; payload: { question: Question; index: number } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'SELECT_ANSWER'; payload: string }
  | { type: 'SHOW_ANSWER' }
  | { type: 'ANSWER_SUBMITTED'; payload: AnswerSubmittedPayload }
  | { type: 'SKIP_FEEDBACK' }
  | { type: 'TICK_TIMER'; payload: number }
  | { type: 'TICK_FEEDBACK_TIMER'; payload: number }
  | { type: 'SET_SCREEN'; payload: GameState['currentScreen'] }
  | { type: 'RESET_GAME' }
  | { type: 'PLAY_AGAIN' }
  | { type: 'END_GAME' }
  | { type: 'FINISH_EXAM' }
  | { type: 'VIEW_USER'; payload: number };
