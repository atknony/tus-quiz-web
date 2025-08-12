import { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { GameState, GameAction, Difficulty, Section, Question } from '@/lib/types';
import { getMaxTime } from '@/lib/gameLogic';

const initialState: GameState = {
  currentScreen: 'welcome',
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
  gameOver: false
};

function isLastQuestion(state: GameState) {
  return state.currentQuestionIndex >= state.questions.length - 1;
}

async function resolveSubjectIdBySection(section: Section | null): Promise<number | undefined> {
  if (!section) return undefined;
  const sectionName = typeof section === 'string' ? section : (section as any)?.name ?? String(section);
  try {
    const res = await apiRequest('GET', '/api/subjects/', undefined);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.results ?? []);
    const found = list.find((s: any) => String(s.name).toLowerCase() === String(sectionName).toLowerCase());
    return found?.id;
  } catch {
    return undefined;
  }
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SECTION':
      return { ...initialState, section: action.payload };

    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.payload, currentScreen: 'game' };

    case 'SET_QUESTIONS':
      return {
        ...state,
        questions: action.payload,
        isTimerRunning: true,
        currentQuestionIndex: 0,
        currentQuestionTime: 0,
        selectedAnswer: null,
        correctAnswers: 0,
        wrongAnswers: 0,
        totalTime: 0,
        gameOver: false,
        currentScreen: 'game',
        feedbackTimeRemaining: 15
      };

    case 'NEXT_QUESTION': {
      const last = isLastQuestion(state);
      if (last) {
        // (Normal akışta kullanılmıyor; yine de güvenli kalsın)
        return { ...state, currentScreen: 'result', gameOver: true, isTimerRunning: false };
      }
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        currentQuestionTime: 0,
        selectedAnswer: null,
        isTimerRunning: true,
        feedbackTimeRemaining: 15
      };
    }

    case 'SHOW_ANSWER': {
      const newWrong = state.wrongAnswers + 1;
      const last = isLastQuestion(state);
      const willBeGameOver = newWrong >= 5 || last;
      return {
        ...state,
        wrongAnswers: newWrong,
        totalTime: state.totalTime + state.currentQuestionTime,
        isTimerRunning: false,
        feedbackTimeRemaining: 15,
        gameOver: willBeGameOver,
        currentScreen: 'feedback'
      };
    }

    case 'SELECT_ANSWER': {
      const q: any = state.questions[state.currentQuestionIndex];
      const correctIdx = q?.choices ? q.choices.findIndex((c: any) => c.is_correct) : -1;
      const correctLetter = correctIdx >= 0 ? String.fromCharCode(65 + correctIdx) : '';
      const isCorrect = action.payload === correctLetter;
      const last = isLastQuestion(state);

      if (isCorrect) {
        const willBeGameOver = last; // son soruyu doğru yaptıysa da sınav biter (manuel)
        return {
          ...state,
          correctAnswers: state.correctAnswers + 1,
          totalTime: state.totalTime + state.currentQuestionTime,
          selectedAnswer: action.payload,
          isTimerRunning: false,
          feedbackTimeRemaining: 5,
          gameOver: willBeGameOver,
          currentScreen: 'feedback'
        };
      } else {
        const newWrong = state.wrongAnswers + 1;
        const willBeGameOver = newWrong >= 5 || last;
        return {
          ...state,
          wrongAnswers: newWrong,
          totalTime: state.totalTime + state.currentQuestionTime,
          selectedAnswer: action.payload,
          isTimerRunning: false,
          feedbackTimeRemaining: 15,
          gameOver: willBeGameOver,
          currentScreen: 'feedback'
        };
      }
    }

    case 'TICK_TIMER': {
      const newTime = state.currentQuestionTime + action.payload;
      const maxTime = getMaxTime(state.difficulty);
      if (newTime >= maxTime) {
        const newWrong = state.wrongAnswers + 1;
        const last = isLastQuestion(state);
        const willBeGameOver = newWrong >= 5 || last;
        return {
          ...state,
          wrongAnswers: newWrong,
          totalTime: state.totalTime + maxTime,
          isTimerRunning: false,
          currentQuestionTime: maxTime,
          gameOver: willBeGameOver,
          currentScreen: 'feedback'
        };
      }
      return { ...state, currentQuestionTime: newTime };
    }

    case 'SKIP_FEEDBACK': {
      const last = isLastQuestion(state);
      const tooManyWrong = state.wrongAnswers >= 5;
      if (!last && !tooManyWrong) {
        return {
          ...state,
          currentScreen: 'game',
          currentQuestionIndex: state.currentQuestionIndex + 1,
          currentQuestionTime: 0,
          selectedAnswer: null,
          isTimerRunning: true,
          feedbackTimeRemaining: 15
        };
      }
      // son soru ya da 5 yanlış durumunda bekle (butonla bitir)
      return state;
    }

    case 'TICK_FEEDBACK_TIMER': {
      const newFeedback = state.feedbackTimeRemaining - action.payload;
      const last = isLastQuestion(state);
      const tooManyWrong = state.wrongAnswers >= 5;

      if (newFeedback <= 0) {
        if (!last && !tooManyWrong) {
          return {
            ...state,
            currentScreen: 'game',
            currentQuestionIndex: state.currentQuestionIndex + 1,
            currentQuestionTime: 0,
            selectedAnswer: null,
            isTimerRunning: true,
            feedbackTimeRemaining: 15
          };
        }
        // bitirme durumu varsa otomatik result'a geçME – butonu bekle
        return { ...state, feedbackTimeRemaining: 0, isTimerRunning: false };
      }
      return { ...state, feedbackTimeRemaining: newFeedback };
    }

    case 'SET_SCREEN':
      return { ...state, currentScreen: action.payload };

    case 'RESET_GAME':
      return { ...initialState };

    case 'END_GAME':
      return { ...state, currentScreen: 'result', gameOver: true, isTimerRunning: false };

    case 'FINISH_EXAM':
      return { ...state, currentScreen: 'result', isTimerRunning: false, feedbackTimeRemaining: 0, gameOver: true };

    default:
      return state;
  }
}

type GameStateContextType = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
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

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const timerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const startGame = async (difficulty: Difficulty) => {
    dispatch({ type: 'SET_DIFFICULTY', payload: difficulty });
    try {
      const subjectId = await resolveSubjectIdBySection(state.section);
      const params = new URLSearchParams({ n: '20' });
      if (subjectId) params.set('subject', String(subjectId));
      const url = `/api/questions/random/?${params.toString()}`;
      const res = await apiRequest('GET', url, undefined);
      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : (raw.results ?? []);
      dispatch({ type: 'SET_QUESTIONS', payload: list as unknown as Question[] });
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      dispatch({ type: 'RESET_GAME' });
    }
  };

  const playAgain = async () => {
    dispatch({ type: 'RESET_GAME' });
    if (state.section && state.difficulty) {
      dispatch({ type: 'SET_SECTION', payload: state.section });
      await startGame(state.difficulty);
    }
  };

  // soru süresi sayacı
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.isTimerRunning]);

  // feedback sayacı
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
      if (feedbackTimerRef.current) {
        clearInterval(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
    };
  }, [state.currentScreen]);

  const selectSection = (section: Section) => dispatch({ type: 'SET_SECTION', payload: section });
  const checkAnswer = (answer: string) => dispatch({ type: 'SELECT_ANSWER', payload: answer });
  const showAnswer = () => dispatch({ type: 'SHOW_ANSWER' });
  const skipFeedback = () => dispatch({ type: 'SKIP_FEEDBACK' });
  const finishExam = () => dispatch({ type: 'FINISH_EXAM' });
  const returnToMenu = () => dispatch({ type: 'RESET_GAME' });

  return (
    <GameStateContext.Provider
      value={{
        state,
        dispatch,
        selectSection,
        startGame,
        checkAnswer,
        showAnswer,
        skipFeedback,
        finishExam,
        playAgain,
        returnToMenu
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
