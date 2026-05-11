import { Check, X, Eye } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { formatTime } from '@/lib/gameLogic';
import { Button } from '@/components/ui/button';
import { SurfaceCard } from '@/components/ui/surface-card';
import { cn } from '@/lib/utils';

export default function FeedbackScreen() {
  const { state, skipFeedback, finishExam } = useGameState();
  const { questions, currentQuestionIndex, selectedAnswer, feedbackTimeRemaining, gameOver } = state;

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;

  if (!currentQuestion) return null;

  const userClickedShowAnswer = selectedAnswer === null || selectedAnswer === undefined;

  const statusTone = userClickedShowAnswer
    ? 'text-muted-foreground'
    : isCorrect
      ? 'text-success'
      : 'text-danger';

  const StatusIcon = userClickedShowAnswer ? Eye : isCorrect ? Check : X;
  const statusLabel = userClickedShowAnswer ? 'Doğru cevap' : isCorrect ? 'Doğru' : 'Yanlış';

  return (
    <div className="animate-fade-in">
      {/* Inline status row */}
      <div className="flex items-center justify-between mb-6">
        <div className={cn("inline-flex items-center gap-2 text-caption", statusTone)}>
          <StatusIcon className="w-4 h-4" />
          <span className="font-medium uppercase tracking-wider">{statusLabel}</span>
        </div>
        <div className="text-caption text-muted-foreground tabular-nums font-mono">
          {formatTime(feedbackTimeRemaining)}
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <p className="font-serif text-body-lg text-foreground leading-relaxed">
          {currentQuestion.text}
        </p>
      </div>

      {/* Answer options */}
      <div className="space-y-2 mb-6">
        {currentQuestion.options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index);
          const isSelectedAnswer = optionLetter === selectedAnswer;
          const isCorrectAnswer = optionLetter === currentQuestion.correctAnswer;
          const showWrongState = isSelectedAnswer && !isCorrectAnswer && !userClickedShowAnswer;

          return (
            <div
              key={index}
              className={cn(
                "px-4 sm:px-5 py-3.5 rounded-xl border transition-colors",
                isCorrectAnswer && "bg-success-soft border-success/30 border-l-2 border-l-success",
                showWrongState && "bg-danger-soft border-danger/30 border-l-2 border-l-danger",
                !isCorrectAnswer && !showWrongState && "bg-surface border-transparent"
              )}
            >
              <div className="flex items-baseline gap-3">
                <span
                  className={cn(
                    "font-serif text-caption tabular-nums shrink-0 w-4",
                    isCorrectAnswer ? "text-success" : showWrongState ? "text-danger" : "text-muted-soft"
                  )}
                >
                  {optionLetter}
                </span>
                <div className="flex-1">
                  <span className="text-body-lg text-foreground">{option}</span>
                  {isCorrectAnswer && (
                    <div className="mt-1 inline-flex items-center gap-1 text-caption text-success">
                      <Check className="w-3.5 h-3.5" />
                      Doğru cevap
                    </div>
                  )}
                  {showWrongState && (
                    <div className="mt-1 inline-flex items-center gap-1 text-caption text-danger">
                      <X className="w-3.5 h-3.5" />
                      Sizin cevabınız
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      {currentQuestion.explanation && (
        <SurfaceCard variant="inset" padding="md" className="mb-6">
          <div className="font-serif italic text-caption text-muted-foreground mb-1.5">Açıklama</div>
          <p className="text-body text-foreground/90 leading-relaxed">{currentQuestion.explanation}</p>
        </SurfaceCard>
      )}

      {/* CTA */}
      <div className="flex justify-center">
        {gameOver ? (
          <Button variant="outline" onClick={() => finishExam()} className="text-danger border-danger/30 hover:bg-danger-soft hover:border-danger/40">
            Sınavı Bitir
          </Button>
        ) : (
          <Button onClick={() => skipFeedback()} className="min-w-[140px]">
            Geç
          </Button>
        )}
      </div>
    </div>
  );
}
