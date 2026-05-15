import { useGameState } from '@/hooks/useGameState';
import { getDifficultyName, getMaxTime, formatTime } from '@/lib/gameLogic';
import { Button } from '@/components/ui/button';

export default function GameScreen() {
  const { state, checkAnswer, showAnswer } = useGameState();
  const { difficulty, section, questions, totalQuestions, currentQuestionIndex, correctAnswers, wrongAnswers, currentQuestionTime, currentStreak } = state;

  const currentQuestion = questions[currentQuestionIndex];
  const maxTime = getMaxTime(difficulty);
  const timePercentage = Math.min(100, (currentQuestionTime / maxTime) * 100);
  const timeRemaining = Math.max(0, maxTime - currentQuestionTime);

  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-foreground" />
      </div>
    );
  }

  const handleAnswerClick = (_option: string, index: number) => {
    const answer = String.fromCharCode(65 + index);
    checkAnswer(answer);
  };

  const sectionLabel = section === 'klinik' ? 'Klinik' : section === 'preklinik' ? 'Preklinik' : null;

  return (
    <div className="animate-fade-in">
      {/* Low-contrast top strip */}
      <div className="flex items-center justify-between text-caption text-muted-foreground mb-2">
        <div className="flex items-center gap-2 truncate">
          <span className="tabular-nums">Soru {currentQuestionIndex + 1} / {totalQuestions}</span>
          {sectionLabel && <><span aria-hidden>·</span><span>{sectionLabel}</span></>}
          {difficulty && <><span aria-hidden>·</span><span>{getDifficultyName(difficulty)}</span></>}
          {currentStreak >= 2 && <><span aria-hidden>·</span><span>Seri {currentStreak}</span></>}
        </div>
        <div className="font-mono tabular-nums text-foreground/80">{formatTime(timeRemaining)}</div>
      </div>

      {/* Hairline timer bar */}
      <div className="relative h-[2px] bg-border mb-8 overflow-hidden rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-foreground transition-all duration-1000 ease-linear"
          style={{ width: `${100 - timePercentage}%` }}
        />
      </div>

      {/* Question */}
      <div className="mb-8">
        <p className="font-serif text-body-lg text-foreground leading-relaxed">
          {currentQuestion.text}
        </p>
      </div>

      {/* Answer options */}
      <div className="space-y-2 mb-8">
        {currentQuestion.options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index);
          return (
            <button
              key={index}
              onClick={() => handleAnswerClick(option, index)}
              className="group w-full text-left px-4 sm:px-5 py-3.5 rounded-xl bg-surface border border-transparent hover:bg-surface-sunken hover:border-border focus-visible:outline-none focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-ring/40 transition-all"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-caption text-muted-soft group-hover:text-muted-foreground tabular-nums shrink-0 w-4">
                  {optionLetter}
                </span>
                <span className="text-body-lg text-foreground">{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer row: stats + show answer */}
      <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/60">
        <div className="flex items-center gap-4 text-caption text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="tabular-nums">{correctAnswers}</span>
            <span>doğru</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1" aria-label={`${wrongAnswers} / 5 yanlış`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={
                    "w-1.5 h-1.5 rounded-full transition-colors " +
                    (i < wrongAnswers ? "bg-danger" : "bg-border")
                  }
                />
              ))}
            </div>
            <span className="tabular-nums">{wrongAnswers}/5</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span>Toplam</span>
            <span className="font-mono tabular-nums">{formatTime(state.totalTime)}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => showAnswer()} className="text-muted-foreground hover:text-foreground">
          Cevabı Göster
        </Button>
      </div>
    </div>
  );
}
