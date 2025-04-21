import { Clock, AlertTriangle, Zap } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { Difficulty } from '@/lib/types';

export default function WelcomeScreen() {
  const { startGame } = useGameState();
  
  const handleDifficultySelect = (difficulty: Difficulty) => {
    startGame(difficulty);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">TUS Quiz Game</h1>
      <p className="text-gray-600 mb-8 text-center">Test your knowledge for the Medical Specialization Exam</p>
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Choose Difficulty Level</h2>
        
        {/* Difficulty selection cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Easy mode */}
          <div 
            className="bg-blue-50 border-2 border-blue-200 hover:border-blue-500 rounded-lg p-4 cursor-pointer transition-all"
            onClick={() => handleDifficultySelect('easy')}
          >
            <h3 className="font-bold text-lg text-blue-700 mb-2">Easy</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-blue-500" />
                120 seconds per question
              </li>
              <li className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-blue-500" />
                +120s penalty per mistake
              </li>
              <li className="flex items-center">
                <Zap className="h-4 w-4 mr-1 text-blue-500" />
                Best for beginners
              </li>
            </ul>
          </div>
          
          {/* Medium mode */}
          <div 
            className="bg-amber-50 border-2 border-amber-200 hover:border-amber-500 rounded-lg p-4 cursor-pointer transition-all"
            onClick={() => handleDifficultySelect('medium')}
          >
            <h3 className="font-bold text-lg text-amber-700 mb-2">Medium</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-amber-500" />
                60 seconds per question
              </li>
              <li className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                +60s penalty per mistake
              </li>
              <li className="flex items-center">
                <Zap className="h-4 w-4 mr-1 text-amber-500" />
                For intermediate students
              </li>
            </ul>
          </div>
          
          {/* Expert mode */}
          <div 
            className="bg-red-50 border-2 border-red-200 hover:border-red-500 rounded-lg p-4 cursor-pointer transition-all"
            onClick={() => handleDifficultySelect('expert')}
          >
            <h3 className="font-bold text-lg text-red-700 mb-2">Expert</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-red-500" />
                30 seconds per question
              </li>
              <li className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                +30s penalty per mistake
              </li>
              <li className="flex items-center">
                <Zap className="h-4 w-4 mr-1 text-red-500" />
                For exam-ready students
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <h3 className="font-semibold mb-2">Game Rules:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Answer as many questions as you can</li>
            <li>Game ends after 5 incorrect answers</li>
            <li>Questions must be answered before the timer runs out</li>
            <li>Lower final score is better</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
