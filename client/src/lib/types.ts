export type Difficulty = 'easy' | 'medium' | 'expert';

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GameState {
  currentScreen: 'welcome' | 'game' | 'feedback' | 'result';
  difficulty: Difficulty | null;
  questions: Question[];
  currentQuestionIndex: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalTime: number;
  currentQuestionTime: number;
  selectedAnswer: string | null;
  isTimerRunning: boolean;
  feedbackTimeRemaining: number;
  gameOver: boolean;
}

export type GameAction = 
  | { type: 'SET_DIFFICULTY'; payload: Difficulty }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'NEXT_QUESTION' }
  | { type: 'SELECT_ANSWER'; payload: string }
  | { type: 'TICK_TIMER'; payload: number }
  | { type: 'TICK_FEEDBACK_TIMER'; payload: number }
  | { type: 'SET_SCREEN'; payload: GameState['currentScreen'] }
  | { type: 'RESET_GAME' }
  | { type: 'END_GAME' };
