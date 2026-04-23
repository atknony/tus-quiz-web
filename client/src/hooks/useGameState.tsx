import { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
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

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SECTION':
      return {
        ...initialState,
        section: action.payload
      };
      
    case 'SET_DIFFICULTY':
      return {
        ...state,
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
    
    case 'SHOW_ANSWER': {
      // Count this as a wrong answer
      const newWrongAnswers = state.wrongAnswers + 1;
      const gameOver = newWrongAnswers >= 5;
      
      return {
        ...state,
        wrongAnswers: newWrongAnswers,
        totalTime: state.totalTime + state.currentQuestionTime,
        // Important: Don't set selectedAnswer to the correct answer
        // Instead we'll handle this visually in the GameScreen component
        isTimerRunning: false,
        feedbackTimeRemaining: 15, // Keep 15 seconds for incorrect answers
        gameOver: gameOver,
        currentScreen: 'feedback' // Always show feedback first, even when game is over
      };
    }
    
    case 'SELECT_ANSWER': {
      const isCorrect = state.questions[state.currentQuestionIndex]?.correctAnswer === action.payload;
      
      if (isCorrect) {
        return {
          ...state,
          correctAnswers: state.correctAnswers + 1,
          totalTime: state.totalTime + state.currentQuestionTime,
          selectedAnswer: action.payload,
          isTimerRunning: false,
          feedbackTimeRemaining: 5, // Reduce feedback time to 5 seconds for correct answers
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
          feedbackTimeRemaining: 15, // Keep 15 seconds for incorrect answers
          gameOver: gameOver,
          currentScreen: 'feedback' // Always show feedback first, even when game is over
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
          currentScreen: 'feedback' // Always show feedback first, even when game is over
        };
      }
      
      return {
        ...state,
        currentQuestionTime: newTime
      };
    }
    
    case 'SKIP_FEEDBACK': {
      if (state.gameOver) {
        return {
          ...state,
          currentScreen: 'result',
          feedbackTimeRemaining: 0
        };
      }
      
      // Check if we've reached the end of all questions
      if (state.currentQuestionIndex >= state.questions.length - 1) {
        return {
          ...state,
          currentScreen: 'result',
          gameOver: true,
          isTimerRunning: false,
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
    
    case 'TICK_FEEDBACK_TIMER': {
      const newFeedbackTime = state.feedbackTimeRemaining - action.payload;
      
      if (newFeedbackTime <= 0) {
        // When game is over, we don't automatically navigate away 
        // User must click "Sınavı Bitir" button to see results
        if (state.gameOver) {
          return {
            ...state,
            feedbackTimeRemaining: 0 // Just keep the timer at 0
          };
        }
        
        // Check if we've reached the end of all questions
        if (state.currentQuestionIndex >= state.questions.length - 1) {
          return {
            ...state,
            currentScreen: 'result',
            gameOver: true,
            isTimerRunning: false,
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
      
    case 'FINISH_EXAM':
      return {
        ...state,
        currentScreen: 'result',
        isTimerRunning: false,
        feedbackTimeRemaining: 0
      };
    
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
  
  // Select section function
  const selectSection = (section: Section) => {
    dispatch({ type: 'SET_SECTION', payload: section });
  };
  
  // Start game function
  const startGame = async (difficulty: Difficulty) => {
    dispatch({ type: 'SET_DIFFICULTY', payload: difficulty });
    
    try {
      // Get questions for the selected section
      const endpoint = state.section ? `/api/questions/${state.section}` : '/api/questions';
      const response = await apiRequest('GET', endpoint, undefined);
      const data = await response.json();
      
      // Shuffle the questions randomly
      const shuffledQuestions = [...data].sort(() => Math.random() - 0.5);
      
      dispatch({ type: 'SET_QUESTIONS', payload: shuffledQuestions });
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
  
  // Show answer function
  const showAnswer = () => {
    dispatch({ type: 'SHOW_ANSWER' });
  };
  
  // Skip feedback function
  const skipFeedback = () => {
    dispatch({ type: 'SKIP_FEEDBACK' });
  };
  
  // Finish exam function
  const finishExam = () => {
    dispatch({ type: 'FINISH_EXAM' });
  };
  
  // Play again function
  const playAgain = async () => {
    // First reset the game state completely
    dispatch({ type: 'RESET_GAME' });
    
    // If we have section and difficulty info, restart with those settings
    if (state.section) {
      dispatch({ type: 'SET_SECTION', payload: state.section });
      
      if (state.difficulty) {
        try {
          // Get fresh questions for the selected section
          const endpoint = state.section ? `/api/questions/${state.section}` : '/api/questions';
          const response = await apiRequest('GET', endpoint, undefined);
          const data = await response.json();
          
          // Shuffle the questions freshly
          const shuffledQuestions = [...data].sort(() => Math.random() - 0.5);
          
          // Set difficulty and then questions (in that order)
          dispatch({ type: 'SET_DIFFICULTY', payload: state.difficulty });
          dispatch({ type: 'SET_QUESTIONS', payload: shuffledQuestions });
        } catch (error) {
          console.error('Failed to fetch questions:', error);
          // If there's an error, reset to welcome screen
          dispatch({ type: 'RESET_GAME' });
        }
      }
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
