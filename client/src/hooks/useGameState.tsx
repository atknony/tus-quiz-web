import { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { GameState, GameAction, GameMode, Difficulty, Section, Question, CategoryPerformance } from '@/lib/types';
import { getMaxTime } from '@/lib/gameLogic';

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function updateCategory(perf: CategoryPerformance, category: string, field: 'correct' | 'wrong'): CategoryPerformance {
  const existing = perf[category] ?? { correct: 0, wrong: 0 };
  return { ...perf, [category]: { ...existing, [field]: existing[field] + 1 } };
}

const initialState: GameState = {
  currentScreen: 'mode',
  mode: null,
  gameId: null,
  section: null,
  difficulty: null,
  questions: [],
  currentQuestionIndex: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  totalTime: 0,
  currentQuestionTime: 0,
  selectedAnswer: null,
  isTimerRunning: false,
  feedbackTimeRemaining: 15,
  gameOver: false,
  currentStreak: 0,
  maxStreak: 0,
  categoryPerformance: {},
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload,
        currentScreen: 'welcome',
      };

    case 'SET_GAME_ID':
      return {
        ...state,
        gameId: action.payload,
      };

    case 'SET_SECTION':
      return {
        ...initialState,
        mode: state.mode,
        currentScreen: 'welcome',
        section: action.payload,
      };

    case 'SET_DIFFICULTY':
      return {
        ...state,
        difficulty: action.payload,
        currentScreen: 'game',
      };

    case 'SET_QUESTIONS':
      return {
        ...state,
        questions: action.payload,
        isTimerRunning: true,
      };

    case 'NEXT_QUESTION':
      if (state.currentQuestionIndex >= state.questions.length - 1) {
        return {
          ...state,
          currentScreen: 'result',
          gameOver: true,
          isTimerRunning: false,
        };
      }
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        currentQuestionTime: 0,
        selectedAnswer: null,
        isTimerRunning: true,
        feedbackTimeRemaining: 15,
      };

    case 'SHOW_ANSWER': {
      const q = state.questions[state.currentQuestionIndex];
      const category = q?.category ?? 'Genel';
      const newWrong = state.wrongAnswers + 1;
      return {
        ...state,
        wrongAnswers: newWrong,
        totalTime: state.totalTime + state.currentQuestionTime,
        isTimerRunning: false,
        feedbackTimeRemaining: 15,
        gameOver: newWrong >= 5,
        currentScreen: 'feedback',
        currentStreak: 0,
        categoryPerformance: updateCategory(state.categoryPerformance, category, 'wrong'),
      };
    }

    case 'SELECT_ANSWER': {
      const q = state.questions[state.currentQuestionIndex];
      const category = q?.category ?? 'Genel';
      const isCorrect = q?.correctAnswer === action.payload;

      if (isCorrect) {
        const newStreak = state.currentStreak + 1;
        return {
          ...state,
          correctAnswers: state.correctAnswers + 1,
          totalTime: state.totalTime + state.currentQuestionTime,
          selectedAnswer: action.payload,
          isTimerRunning: false,
          feedbackTimeRemaining: 5,
          currentScreen: state.currentScreen === 'game' ? 'feedback' : state.currentScreen,
          currentStreak: newStreak,
          maxStreak: Math.max(state.maxStreak, newStreak),
          categoryPerformance: updateCategory(state.categoryPerformance, category, 'correct'),
        };
      } else {
        const newWrong = state.wrongAnswers + 1;
        return {
          ...state,
          wrongAnswers: newWrong,
          totalTime: state.totalTime + state.currentQuestionTime,
          selectedAnswer: action.payload,
          isTimerRunning: false,
          feedbackTimeRemaining: 15,
          gameOver: newWrong >= 5,
          currentScreen: 'feedback',
          currentStreak: 0,
          categoryPerformance: updateCategory(state.categoryPerformance, category, 'wrong'),
        };
      }
    }

    case 'TICK_TIMER': {
      const newTime = state.currentQuestionTime + action.payload;
      const maxTime = getMaxTime(state.difficulty);

      if (newTime >= maxTime) {
        const q = state.questions[state.currentQuestionIndex];
        const category = q?.category ?? 'Genel';
        const newWrong = state.wrongAnswers + 1;
        return {
          ...state,
          wrongAnswers: newWrong,
          totalTime: state.totalTime + maxTime,
          isTimerRunning: false,
          currentQuestionTime: maxTime,
          gameOver: newWrong >= 5,
          currentScreen: 'feedback',
          currentStreak: 0,
          categoryPerformance: updateCategory(state.categoryPerformance, category, 'wrong'),
        };
      }
      return {
        ...state,
        currentQuestionTime: newTime,
      };
    }

    case 'SKIP_FEEDBACK': {
      if (state.gameOver) {
        return { ...state, currentScreen: 'result', feedbackTimeRemaining: 0 };
      }
      if (state.currentQuestionIndex >= state.questions.length - 1) {
        return { ...state, currentScreen: 'result', gameOver: true, isTimerRunning: false, feedbackTimeRemaining: 0 };
      }
      return {
        ...state,
        currentScreen: 'game',
        currentQuestionIndex: state.currentQuestionIndex + 1,
        currentQuestionTime: 0,
        selectedAnswer: null,
        isTimerRunning: true,
        feedbackTimeRemaining: 15,
      };
    }

    case 'TICK_FEEDBACK_TIMER': {
      const newFeedbackTime = state.feedbackTimeRemaining - action.payload;
      if (newFeedbackTime <= 0) {
        if (state.gameOver) return { ...state, feedbackTimeRemaining: 0 };
        if (state.currentQuestionIndex >= state.questions.length - 1) {
          return { ...state, currentScreen: 'result', gameOver: true, isTimerRunning: false, feedbackTimeRemaining: 0 };
        }
        return {
          ...state,
          currentScreen: 'game',
          currentQuestionIndex: state.currentQuestionIndex + 1,
          currentQuestionTime: 0,
          selectedAnswer: null,
          isTimerRunning: true,
          feedbackTimeRemaining: 15,
        };
      }
      return { ...state, feedbackTimeRemaining: newFeedbackTime };
    }

    case 'SET_SCREEN':
      return { ...state, currentScreen: action.payload };

    case 'RESET_GAME':
      return { ...initialState };

    case 'PLAY_AGAIN':
      return {
        ...initialState,
        mode: state.mode,
        currentScreen: 'welcome',
      };

    case 'END_GAME':
      return { ...state, currentScreen: 'result', gameOver: true, isTimerRunning: false };

    case 'FINISH_EXAM':
      return { ...state, currentScreen: 'result', isTimerRunning: false, feedbackTimeRemaining: 0 };

    default:
      return state;
  }
}

type GameStateContextType = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  selectMode: (mode: GameMode) => void;
  selectSection: (section: Section) => void;
  startGame: (difficulty: Difficulty) => void;
  checkAnswer: (answer: string) => void;
  showAnswer: () => void;
  skipFeedback: () => void;
  finishExam: () => void;
  playAgain: () => void;
  returnToMenu: () => void;
};

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

function buildSnapshot(s: GameState) {
  return {
    correctAnswers: s.correctAnswers,
    wrongAnswers: s.wrongAnswers,
    totalTime: Math.round(s.totalTime),
    finalScore: Math.round(s.totalTime),
    maxStreak: s.maxStreak,
    totalQuestionsAnswered: s.correctAnswers + s.wrongAnswers,
    categoryPerformance: s.categoryPerformance,
  };
}

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const timerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  const completedRef = useRef(false);
  const prevTotalAnswersRef = useRef(0);

  // Keep stateRef in sync with latest state for use in event handlers
  useEffect(() => { stateRef.current = state; }, [state]);

  // Reset completedRef when gameId is cleared (new game / reset)
  useEffect(() => {
    if (state.gameId === null) {
      completedRef.current = false;
      prevTotalAnswersRef.current = 0;
    }
  }, [state.gameId]);

  // Handle timer
  useEffect(() => {
    if (state.isTimerRunning) {
      timerRef.current = window.setInterval(() => {
        dispatch({ type: 'TICK_TIMER', payload: 0.1 });
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [state.isTimerRunning]);

  // Handle feedback timer
  useEffect(() => {
    if (state.currentScreen === 'feedback') {
      feedbackTimerRef.current = window.setInterval(() => {
        dispatch({ type: 'TICK_FEEDBACK_TIMER', payload: 0.1 });
      }, 100);
    } else if (feedbackTimerRef.current) {
      clearInterval(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    return () => {
      if (feedbackTimerRef.current) { clearInterval(feedbackTimerRef.current); feedbackTimerRef.current = null; }
    };
  }, [state.currentScreen]);

  // Competitive: snapshot after each answer
  useEffect(() => {
    const totalAnswers = state.correctAnswers + state.wrongAnswers;
    if (
      totalAnswers > prevTotalAnswersRef.current &&
      state.mode === 'competitive' &&
      state.gameId !== null
    ) {
      prevTotalAnswersRef.current = totalAnswers;
      const snapshot = buildSnapshot(state);
      apiRequest('PATCH', `/api/games/${state.gameId}`, snapshot).catch(e =>
        console.error('[sync] snapshot failed', e)
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.correctAnswers, state.wrongAnswers]);

  // Competitive: finalize when result screen appears
  useEffect(() => {
    if (
      state.currentScreen === 'result' &&
      state.mode === 'competitive' &&
      state.gameId !== null &&
      !completedRef.current
    ) {
      completedRef.current = true;
      const snapshot = buildSnapshot(state);
      apiRequest('PATCH', `/api/games/${state.gameId}/complete`, snapshot).catch(e =>
        console.error('[sync] complete failed', e)
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentScreen]);

  // Competitive: send beacon on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      const s = stateRef.current;
      if (s.mode === 'competitive' && s.gameId !== null && !completedRef.current) {
        navigator.sendBeacon(
          `/api/games/${s.gameId}`,
          new Blob([JSON.stringify(buildSnapshot(s))], { type: 'application/json' })
        );
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const selectMode = (mode: GameMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  };

  const selectSection = (section: Section) => {
    dispatch({ type: 'SET_SECTION', payload: section });
  };

  const startGame = async (difficulty: Difficulty) => {
    dispatch({ type: 'SET_DIFFICULTY', payload: difficulty });

    try {
      const endpoint = state.section ? `/api/questions/${state.section}` : '/api/questions';
      const response = await apiRequest('GET', endpoint, undefined);
      const data: Question[] = await response.json();
      const shuffledQuestions = fisherYatesShuffle(data);
      dispatch({ type: 'SET_QUESTIONS', payload: shuffledQuestions });

      // Create server game row for competitive mode
      if (state.mode === 'competitive') {
        try {
          const res = await apiRequest('POST', '/api/games', {
            mode: 'competitive',
            section: state.section ?? 'klinik',
            difficulty,
          });
          const { gameId } = await res.json() as { gameId: number };
          dispatch({ type: 'SET_GAME_ID', payload: gameId });
        } catch (e) {
          console.error('[sync] game create failed', e);
        }
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      dispatch({ type: 'RESET_GAME' });
    }
  };

  const checkAnswer = (answer: string) => {
    dispatch({ type: 'SELECT_ANSWER', payload: answer });
  };

  const showAnswer = () => {
    dispatch({ type: 'SHOW_ANSWER' });
  };

  const skipFeedback = () => {
    dispatch({ type: 'SKIP_FEEDBACK' });
  };

  const finishExam = () => {
    dispatch({ type: 'FINISH_EXAM' });
  };

  const playAgain = () => {
    dispatch({ type: 'PLAY_AGAIN' });
  };

  const returnToMenu = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  return (
    <GameStateContext.Provider
      value={{
        state,
        dispatch,
        selectMode,
        selectSection,
        startGame,
        checkAnswer,
        showAnswer,
        skipFeedback,
        finishExam,
        playAgain,
        returnToMenu,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}
