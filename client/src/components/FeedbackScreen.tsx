import { Clock, Check, X } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { formatTime } from '@/lib/gameLogic';

export default function FeedbackScreen() {
  const { state, skipFeedback, finishExam } = useGameState();
  const { questions, currentQuestionIndex, selectedAnswer, feedbackTimeRemaining, gameOver } = state;
  
  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;
  
  if (!currentQuestion) {
    return null;
  }
  
  // This will check if the user clicked "Cevabı Göster" or actually answered
  const userClickedShowAnswer = selectedAnswer === null || selectedAnswer === undefined;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="p-4 text-white">
        <div className={`${userClickedShowAnswer ? 'bg-gray-700' : isCorrect ? 'bg-green-500' : 'bg-red-500'} p-4 rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">
              {userClickedShowAnswer ? 'Doğru Cevap Gösteriliyor' : isCorrect ? 'Doğru Cevap' : 'Yanlış Cevap'}
            </h3>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-1" />
              <span className="font-mono">{formatTime(feedbackTimeRemaining)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-5">
        <p className="text-lg mb-6">{currentQuestion.text}</p>
        
        {/* Answer options with correct highlighted */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const optionLetter = String.fromCharCode(65 + index);
            const isSelectedAnswer = optionLetter === selectedAnswer;
            const isCorrectAnswer = optionLetter === currentQuestion.correctAnswer;
            
            let className = "w-full text-left p-3 border-2 rounded-lg";
            
            if (isCorrectAnswer) {
              className += " bg-green-50 border-green-500";
            } else if (isSelectedAnswer) {
              className += " bg-red-50 border-red-500";
            } else {
              className += " border-gray-200";
            }
            
            return (
              <div key={index} className={className}>
                <span className="font-medium mr-2">{optionLetter}.</span>
                <span>{option}</span>
                
                {isCorrectAnswer && (
                  <div className="mt-1 text-sm text-green-700">
                    <Check className="h-5 w-5 inline mr-1" />
                    Doğru Cevap
                  </div>
                )}
                
                {isSelectedAnswer && !isCorrectAnswer && !userClickedShowAnswer && (
                  <div className="mt-1 text-sm text-red-700">
                    <X className="h-5 w-5 inline mr-1" />
                    Sizin Cevabınız
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {currentQuestion.explanation && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600">
            <p className="font-semibold mb-1">Açıklama:</p>
            <p>{currentQuestion.explanation}</p>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="p-4 flex justify-center border-t">
        {gameOver ? (
          <button
            onClick={() => finishExam()}
            className="py-2 px-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Sınavı Bitir
          </button>
        ) : (
          <button
            onClick={() => skipFeedback()}
            className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Geç
          </button>
        )}
      </div>
    </div>
  );
}
