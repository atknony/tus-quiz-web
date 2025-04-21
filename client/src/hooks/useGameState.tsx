import { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { GameState, GameAction, Difficulty, Question } from '@/lib/types';
import { getMaxTime } from '@/lib/gameLogic';

const initialState: GameState = {
  currentScreen: 'welcome',
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

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_DIFFICULTY':
      return {
        ...initialState,
        difficulty: action.payload,
        currentScreen: 'game'
      };
    
    case 'SET_QUESTIONS':
      return {
        ...state,
        questions: action.payload,
        isTimerRunning: true
      };
    
    case 'NEXT_QUESTION':
      if (state.currentQuestionIndex >= state.questions.length - 1) {
        return {
          ...state,
          currentScreen: 'result',
          gameOver: true,
          isTimerRunning: false
        };
      }
      
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        currentQuestionTime: 0,
        selectedAnswer: null,
        isTimerRunning: true,
        feedbackTimeRemaining: 15
      };
    
    case 'SELECT_ANSWER': {
      const isCorrect = state.questions[state.currentQuestionIndex]?.correctAnswer === action.payload;
      
      if (isCorrect) {
        return {
          ...state,
          correctAnswers: state.correctAnswers + 1,
          totalTime: state.totalTime + state.currentQuestionTime,
          selectedAnswer: action.payload,
          isTimerRunning: false,
          currentScreen: state.currentScreen === 'game' ? 'feedback' : state.currentScreen
        };
      } else {
        const newWrongAnswers = state.wrongAnswers + 1;
        const gameOver = newWrongAnswers >= 5;
        
        return {
          ...state,
          wrongAnswers: newWrongAnswers,
          totalTime: state.totalTime + state.currentQuestionTime,
          selectedAnswer: action.payload,
          isTimerRunning: false,
          gameOver: gameOver,
          currentScreen: gameOver ? 'result' : 'feedback'
        };
      }
    }
    
    case 'TICK_TIMER': {
      const newTime = state.currentQuestionTime + action.payload;
      const maxTime = getMaxTime(state.difficulty);
      
      if (newTime >= maxTime) {
        const newWrongAnswers = state.wrongAnswers + 1;
        const gameOver = newWrongAnswers >= 5;
        
        return {
          ...state,
          wrongAnswers: newWrongAnswers,
          totalTime: state.totalTime + maxTime,
          isTimerRunning: false,
          currentQuestionTime: maxTime,
          gameOver: gameOver,
          currentScreen: gameOver ? 'result' : 'feedback'
        };
      }
      
      return {
        ...state,
        currentQuestionTime: newTime
      };
    }
    
    case 'TICK_FEEDBACK_TIMER': {
      const newFeedbackTime = state.feedbackTimeRemaining - action.payload;
      
      if (newFeedbackTime <= 0) {
        if (state.gameOver) {
          return {
            ...state,
            currentScreen: 'result',
            feedbackTimeRemaining: 0
          };
        }
        
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
      
      return {
        ...state,
        feedbackTimeRemaining: newFeedbackTime
      };
    }
    
    case 'SET_SCREEN':
      return {
        ...state,
        currentScreen: action.payload
      };
    
    case 'RESET_GAME':
      return {
        ...initialState
      };
    
    case 'END_GAME':
      return {
        ...state,
        currentScreen: 'result',
        gameOver: true,
        isTimerRunning: false
      };
    
    default:
      return state;
  }
}

type GameStateContextType = {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  startGame: (difficulty: Difficulty) => void;
  checkAnswer: (answer: string) => void;
  playAgain: () => void;
  returnToMenu: () => void;
};

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const timerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  
  // Handle timer logic
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
  
  // Handle feedback timer logic
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
  
  // We don't need a navigation effect since we're managing screens via state
  
  // Start game function
  const startGame = async (difficulty: Difficulty) => {
    dispatch({ type: 'SET_DIFFICULTY', payload: difficulty });
    
    try {
      const response = await apiRequest('GET', '/api/questions', undefined);
      const data = await response.json();
      dispatch({ type: 'SET_QUESTIONS', payload: data });
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      // If there's an error, we could load some local questions
      // For now, we'll just reset to welcome screen
      dispatch({ type: 'RESET_GAME' });
    }
  };
  
  // Check answer function
  const checkAnswer = (answer: string) => {
    dispatch({ type: 'SELECT_ANSWER', payload: answer });
  };
  
  // Play again function
  const playAgain = async () => {
    if (state.difficulty) {
      await startGame(state.difficulty);
    }
  };
  
  // Return to menu function
  const returnToMenu = () => {
    dispatch({ type: 'RESET_GAME' });
  };
  
  return (
    <GameStateContext.Provider 
      value={{ 
        state, 
        dispatch, 
        startGame, 
        checkAnswer, 
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
