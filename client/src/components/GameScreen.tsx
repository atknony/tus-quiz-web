import { Clock } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { getDifficultyName, getMaxTime, formatTime } from '@/lib/gameLogic';

export default function GameScreen() {
  const { state, checkAnswer } = useGameState();
  const { difficulty, questions, currentQuestionIndex, correctAnswers, wrongAnswers, currentQuestionTime } = state;
  
  const currentQuestion = questions[currentQuestionIndex];
  const maxTime = getMaxTime(difficulty);
  const timePercentage = (currentQuestionTime / maxTime) * 100;
  const timeRemaining = maxTime - currentQuestionTime;
  
  // If no questions are loaded or currentQuestion is undefined, show a loading state
  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const handleAnswerClick = (option: string, index: number) => {
    const answer = String.fromCharCode(65 + index); // Convert index to A, B, C, D, E
    checkAnswer(answer);
  };
  
  return (
    <>
      {/* Game header with stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          <h2 className="text-xl font-bold">{getDifficultyName(difficulty)} Mode</h2>
          <p className="text-sm text-gray-600">
            <span>{correctAnswers}</span> correct | 
            <span className="text-red-600"> {wrongAnswers}</span>/5 incorrect
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium">
            <div className="text-gray-500 mb-1">Total Time</div>
            <div className="font-mono text-lg">{formatTime(state.totalTime)}</div>
          </div>
          
          {/* Wrong answers progress indicator */}
          <div className="flex gap-1">
            {Array(5).fill(0).map((_, i) => (
              <div 
                key={i}
                className={`w-3 h-8 rounded ${i < wrongAnswers ? 'bg-red-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Question card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {/* Timer */}
        <div className="relative h-2 bg-gray-100">
          <div 
            className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-1000"
            style={{ width: `${100 - timePercentage}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center p-4 border-b">
          <div className="font-semibold text-sm text-gray-500">Question <span>{currentQuestionIndex + 1}</span></div>
          <div className="flex items-center gap-1 font-mono text-lg">
            <Clock className="h-5 w-5 text-blue-500" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        </div>
        
        <div className="p-5">
          <p className="text-lg mb-6">{currentQuestion.text}</p>
          
          {/* Answer options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button 
                key={index}
                className="w-full text-left p-3 border-2 border-gray-200 rounded-lg hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                onClick={() => handleAnswerClick(option, index)}
              >
                <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
