import { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { GameState, GameAction, GameMode, Difficulty, Section, Question, CategoryPerformance, AnswerSubmittedPayload } from '@/lib/types';
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
  viewingUserId: null,
  mode: null,
  gameId: null,
  section: null,
  category: null,
  difficulty: null,
  questions: [],
  totalQuestions: 0,
  currentQuestionIndex: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  totalTime: 0,
  score: 0,
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
        category: null,
      };

    case 'SET_CATEGORY':
      return { ...state, category: action.payload };

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
        totalQuestions: action.payload.length,
        isTimerRunning: true,
      };

    case 'START_COMPETITIVE_GAME': {
      const { gameId, question, totalQuestions } = action.payload;
      return {
        ...state,
        gameId,
        questions: [question],
        totalQuestions,
        currentQuestionIndex: 0,
        isTimerRunning: true,
      };
    }

    case 'APPEND_QUESTION': {
      const { question, index } = action.payload;
      if (index !== state.currentQuestionIndex) return state;
      const newQuestions = [...state.questions];
      newQuestions[index] = question;
      return {
        ...state,
        questions: newQuestions,
        isTimerRunning: true,
      };
    }

    case 'NEXT_QUESTION': {
      if (state.currentQuestionIndex >= state.totalQuestions - 1) {
        return {
          ...state,
          currentScreen: 'result',
          gameOver: true,
          isTimerRunning: false,
        };
      }
      const newIndex = state.currentQuestionIndex + 1;
      return {
        ...state,
        currentQuestionIndex: newIndex,
        currentQuestionTime: 0,
        selectedAnswer: null,
        isTimerRunning: state.questions[newIndex] !== undefined,
        feedbackTimeRemaining: 15,
      };
    }

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

    case 'ANSWER_SUBMITTED': {
      // Server-authoritative path (competitive mode). The reducer just applies the response.
      // Inject server-provided correctAnswer/explanation into the question so FeedbackScreen
      // renders identically regardless of whether they were already on the payload.
      const p = action.payload;
      const updatedQuestions = [...state.questions];
      const cur = updatedQuestions[state.currentQuestionIndex];
      if (cur) {
        updatedQuestions[state.currentQuestionIndex] = {
          ...cur,
          correctAnswer: p.correctAnswer,
          explanation: p.explanation ?? cur.explanation,
        };
      }
      return {
        ...state,
        questions: updatedQuestions,
        selectedAnswer: p.selectedAnswer,
        correctAnswers: p.correctAnswers,
        wrongAnswers: p.wrongAnswers,
        totalTime: p.totalTime,
        score: p.score,
        maxStreak: p.maxStreak,
        currentStreak: p.currentStreak,
        categoryPerformance: p.categoryPerformance,
        isTimerRunning: false,
        feedbackTimeRemaining: p.isCorrect ? 5 : 15,
        currentScreen: 'feedback',
        gameOver: p.gameOver,
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
      if (state.currentQuestionIndex >= state.totalQuestions - 1) {
        return { ...state, currentScreen: 'result', gameOver: true, isTimerRunning: false, feedbackTimeRemaining: 0 };
      }
      const newIndex = state.currentQuestionIndex + 1;
      return {
        ...state,
        currentScreen: 'game',
        currentQuestionIndex: newIndex,
        currentQuestionTime: 0,
        selectedAnswer: null,
        isTimerRunning: state.questions[newIndex] !== undefined,
        feedbackTimeRemaining: 15,
      };
    }

    case 'TICK_FEEDBACK_TIMER': {
      const newFeedbackTime = state.feedbackTimeRemaining - action.payload;
      if (newFeedbackTime <= 0) {
        if (state.gameOver) return { ...state, feedbackTimeRemaining: 0 };
        if (state.currentQuestionIndex >= state.totalQuestions - 1) {
          return { ...state, currentScreen: 'result', gameOver: true, isTimerRunning: false, feedbackTimeRemaining: 0 };
        }
        const newIndex = state.currentQuestionIndex + 1;
        return {
          ...state,
          currentScreen: 'game',
          currentQuestionIndex: newIndex,
          currentQuestionTime: 0,
          selectedAnswer: null,
          isTimerRunning: state.questions[newIndex] !== undefined,
          feedbackTimeRemaining: 15,
        };
      }
      return { ...state, feedbackTimeRemaining: newFeedbackTime };
    }

    case 'SET_SCREEN':
      return { ...state, currentScreen: action.payload, viewingUserId: null };

    case 'VIEW_USER':
      return { ...state, currentScreen: 'profile', viewingUserId: action.payload };

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
  selectCategory: (category: string | null) => void;
  startGame: (difficulty: Difficulty) => void;
  checkAnswer: (answer: string) => void;
  showAnswer: () => void;
  skipFeedback: () => void;
  finishExam: () => void;
  playAgain: () => void;
  returnToMenu: () => void;
};

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const timerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  const completedRef = useRef(false);

  // Keep stateRef in sync with latest state for use in event handlers
  useEffect(() => { stateRef.current = state; }, [state]);

  // Reset completedRef when gameId is cleared (new game / reset)
  useEffect(() => {
    if (state.gameId === null) {
      completedRef.current = false;
    }
  }, [state.gameId]);

  // Handle timer
  useEffect(() => {
    if (state.isTimerRunning) {
      timerRef.current = window.setInterval(() => {
        const s = stateRef.current;
        const newTime = s.currentQuestionTime + 0.1;
        const maxTime = getMaxTime(s.difficulty);
        // Competitive: intercept timeout and route through the server answer endpoint.
        // The reducer's TICK_TIMER timeout branch (local correctness) handles practice mode.
        if (newTime >= maxTime && s.mode === 'competitive' && s.gameId !== null) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          void submitAnswerCompetitive(null);
          return;
        }
        dispatch({ type: 'TICK_TIMER', payload: 0.1 });
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Competitive: fetch the current question from the server if it's not loaded yet.
  // This fires after SKIP_FEEDBACK / TICK_FEEDBACK_TIMER advances the index past a question
  // we don't yet have. APPEND_QUESTION then starts the per-question timer.
  useEffect(() => {
    if (state.mode !== 'competitive') return;
    if (state.currentScreen !== 'game') return;
    if (state.gameId === null) return;
    if (state.questions[state.currentQuestionIndex] !== undefined) return;

    let cancelled = false;
    const idx = state.currentQuestionIndex;
    apiRequest('GET', `/api/games/${state.gameId}/question/${idx}`)
      .then(r => r.json())
      .then((data: { question: Question; questionIndex: number }) => {
        if (cancelled) return;
        dispatch({ type: 'APPEND_QUESTION', payload: { question: data.question, index: data.questionIndex } });
      })
      .catch(e => console.error('[next-question] fetch failed', e));
    return () => { cancelled = true; };
  }, [state.mode, state.currentScreen, state.gameId, state.currentQuestionIndex, state.questions]);

  // Competitive: finalize on result screen. POST with no body — server already has
  // the full game state from /answer calls and derives the final score from timings.
  useEffect(() => {
    if (
      state.currentScreen === 'result' &&
      state.mode === 'competitive' &&
      state.gameId !== null &&
      !completedRef.current
    ) {
      completedRef.current = true;
      apiRequest('POST', `/api/games/${state.gameId}/complete`, undefined)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/users'] });
          queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
        })
        .catch(e => console.error('[sync] complete failed', e));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentScreen]);

  const selectMode = (mode: GameMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  };

  const selectSection = (section: Section) => {
    dispatch({ type: 'SET_SECTION', payload: section });
  };

  const selectCategory = (category: string | null) => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
  };

  const startGame = async (difficulty: Difficulty) => {
    dispatch({ type: 'SET_DIFFICULTY', payload: difficulty });

    try {
      if (state.mode === 'competitive') {
        // Server picks the question pool and serves the first question.
        const res = await apiRequest('POST', '/api/games', {
          mode: 'competitive',
          section: state.section ?? 'klinik',
          category: state.category,
          difficulty,
        });
        const data = await res.json() as {
          gameId: number;
          question: Question;
          totalQuestions: number;
        };
        dispatch({
          type: 'START_COMPETITIVE_GAME',
          payload: { gameId: data.gameId, question: data.question, totalQuestions: data.totalQuestions },
        });
      } else {
        // Practice mode: legacy flow — fetch all questions, shuffle client-side, no game row.
        const categoryParam = state.category ? `?category=${encodeURIComponent(state.category)}` : '';
        const endpoint = state.section ? `/api/questions/${state.section}${categoryParam}` : '/api/questions';
        const response = await apiRequest('GET', endpoint, undefined);
        const data: Question[] = await response.json();
        const shuffledQuestions = fisherYatesShuffle(data);
        dispatch({ type: 'SET_QUESTIONS', payload: shuffledQuestions });
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      dispatch({ type: 'RESET_GAME' });
    }
  };

  const submitAnswerCompetitive = async (selectedAnswer: string | null) => {
    const s = stateRef.current;
    if (s.gameId === null) return;
    try {
      const res = await apiRequest('POST', `/api/games/${s.gameId}/answer`, {
        questionIndex: s.currentQuestionIndex,
        selectedAnswer,
      });
      const payload: AnswerSubmittedPayload = await res.json();
      dispatch({ type: 'ANSWER_SUBMITTED', payload });
    } catch (e) {
      console.error('[answer] submission failed', e);
    }
  };

  const checkAnswer = (answer: string) => {
    if (stateRef.current.mode === 'competitive') {
      void submitAnswerCompetitive(answer);
    } else {
      dispatch({ type: 'SELECT_ANSWER', payload: answer });
    }
  };

  const showAnswer = () => {
    if (stateRef.current.mode === 'competitive') {
      void submitAnswerCompetitive(null);
    } else {
      dispatch({ type: 'SHOW_ANSWER' });
    }
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
        selectCategory,
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
