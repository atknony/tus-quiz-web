import { useGameState } from '@/hooks/useGameState';
import { 
  formatTime, 
  calculateFinalScore, 
  calculateAccuracyRate, 
  calculateAvgTimePerQuestion, 
  getPenaltyTimeFormatted, 
  getDifficultyName 
} from '@/lib/gameLogic';

export default function ResultScreen() {
  const { state, playAgain, returnToMenu } = useGameState();
  const { correctAnswers, wrongAnswers, totalTime } = state;
  
  const totalQuestions = correctAnswers + wrongAnswers;
  const finalScore = calculateFinalScore(state);
  const accuracyRate = calculateAccuracyRate(state);
  const avgTimePerQuestion = calculateAvgTimePerQuestion(state);
  const penaltyTime = getPenaltyTimeFormatted(state);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-center mb-2">Game Over</h2>
      <p className="text-center text-gray-600 mb-6">You reached the maximum number of incorrect answers</p>
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-bold text-center text-blue-800 mb-4">Final Score</h3>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Total Questions:</span>
          <span className="font-bold">{totalQuestions}</span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Correct Answers:</span>
          <span className="font-bold text-green-600">{correctAnswers}</span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Incorrect Answers:</span>
          <span className="font-bold text-red-600">{wrongAnswers}</span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Answer Time:</span>
          <span className="font-bold font-mono">{formatTime(totalTime)}</span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Penalty Time:</span>
          <span className="font-bold font-mono text-red-600">{penaltyTime}</span>
        </div>
        
        <div className="border-t border-blue-200 mt-4 pt-4 flex justify-between items-center">
          <span className="text-gray-800 font-semibold">Final Score:</span>
          <span className="font-bold text-xl font-mono">{formatTime(finalScore)}</span>
        </div>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-bold text-center mb-3">Performance Summary</h3>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Difficulty Level:</span>
          <span className="font-medium">{getDifficultyName(state.difficulty)}</span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Accuracy Rate:</span>
          <span className="font-medium">{accuracyRate}</span>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Average Time per Question:</span>
          <span className="font-medium font-mono">{avgTimePerQuestion}</span>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          onClick={playAgain}
        >
          Play Again
        </button>
        <button 
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded-lg font-medium transition-colors"
          onClick={returnToMenu}
        >
          Change Difficulty
        </button>
      </div>
    </div>
  );
}
