import { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useGameState } from '@/hooks/useGameState';
import {
  formatTime,
  calculateAccuracyRate,
  calculateAvgTimePerQuestion,
  getDifficultyName,
} from '@/lib/gameLogic';
import { Button } from '@/components/ui/button';
import { SurfaceCard } from '@/components/ui/surface-card';
import { cn } from '@/lib/utils';

export default function ResultScreen() {
  const { state, playAgain, returnToMenu } = useGameState();
  const { correctAnswers, wrongAnswers, totalTime, score, maxStreak, categoryPerformance, mode } = state;
  const [isSaving, setIsSaving] = useState(false);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const totalQuestions = correctAnswers + wrongAnswers;
  const accuracyRate = calculateAccuracyRate(state);
  const avgTimePerQuestion = calculateAvgTimePerQuestion(state);

  const sortedCategories = Object.entries(categoryPerformance)
    .map(([cat, stats]) => ({
      category: cat,
      correct: stats.correct,
      wrong: stats.wrong,
      total: stats.correct + stats.wrong,
      accuracy: stats.correct + stats.wrong > 0
        ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100)
        : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const saveScreenshot = async () => {
    if (!resultCardRef.current) return;
    setIsSaving(true);
    try {
      const canvas = await html2canvas(resultCardRef.current, {
        backgroundColor: '#FAF9F5',
      });
      const link = document.createElement('a');
      link.download = `TUS-Quiz-Skor-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Screenshot error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div ref={resultCardRef} className="space-y-6">
        <header className="text-center">
          <div className="text-eyebrow text-muted-foreground mb-2">Sonuç</div>
          <h1 className="font-serif text-h1 text-foreground">Oyun Bitti</h1>
          <p className="mt-2 text-body text-muted-foreground">
            Maksimum yanlış cevap sayısına ulaştınız
          </p>
        </header>

        {/* Score block — new server-derived match score */}
        <SurfaceCard padding="lg">
          <div className="text-eyebrow text-muted-foreground mb-4">Maç Skoru</div>
          <div className="font-serif text-display text-foreground tabular-nums mb-6">
            {score.toLocaleString('tr-TR')}
            <span className="ml-2 text-h2 text-muted-soft">puan</span>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-body">
            <div className="flex flex-col">
              <dt className="text-caption text-muted-foreground">Toplam Soru</dt>
              <dd className="font-serif text-h2 text-foreground tabular-nums">{totalQuestions}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-caption text-muted-foreground">Süre</dt>
              <dd className="font-serif text-h2 text-foreground tabular-nums font-mono">{formatTime(totalTime)}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-caption text-muted-foreground">Doğru</dt>
              <dd className="font-serif text-h2 text-success tabular-nums">{correctAnswers}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-caption text-muted-foreground">Yanlış</dt>
              <dd className="font-serif text-h2 text-danger tabular-nums">{wrongAnswers}</dd>
            </div>
          </dl>
        </SurfaceCard>

        {/* Performance */}
        <SurfaceCard padding="lg">
          <div className="text-eyebrow text-muted-foreground mb-4">Performans</div>
          <dl className="divide-y divide-border">
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-body text-muted-foreground">Zorluk</dt>
              <dd className="text-body text-foreground">{getDifficultyName(state.difficulty)}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-body text-muted-foreground">Doğruluk oranı</dt>
              <dd className="text-body text-foreground tabular-nums">{accuracyRate}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-body text-muted-foreground">Soru başına ortalama</dt>
              <dd className="text-body text-foreground tabular-nums font-mono">{avgTimePerQuestion}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-body text-muted-foreground">En uzun seri</dt>
              <dd className="text-body text-foreground tabular-nums">{maxStreak} doğru</dd>
            </div>
          </dl>
        </SurfaceCard>

        {/* Category Performance */}
        {mode === 'competitive' && sortedCategories.length > 0 && (
          <SurfaceCard padding="lg">
            <div className="flex items-baseline justify-between mb-1">
              <div className="text-eyebrow text-muted-foreground">Kategori Performansı</div>
            </div>
            <p className="text-caption text-muted-soft mb-4">En düşük doğruluk oranından en yükseğe</p>
            <div className="space-y-3">
              {sortedCategories.map(({ category, correct, total, accuracy }) => (
                <div key={category} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-caption">
                    <span className="text-foreground truncate" title={category}>{category}</span>
                    <span className="font-mono tabular-nums text-muted-foreground shrink-0">
                      {correct}/{total} · {accuracy}%
                    </span>
                  </div>
                  <div className="h-1 bg-surface-sunken rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        accuracy >= 70 ? "bg-success" : accuracy >= 40 ? "bg-warning" : "bg-danger"
                      )}
                      style={{ width: `${Math.max(2, accuracy)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button
          variant="outline"
          onClick={saveScreenshot}
          disabled={isSaving}
          className="sm:flex-1"
        >
          <Camera className="w-4 h-4" />
          {isSaving ? 'Kaydediliyor...' : 'Ekran Görüntüsü'}
        </Button>
        <Button onClick={playAgain} className="sm:flex-1">
          Tekrar Oyna
        </Button>
        <Button variant="ghost" onClick={returnToMenu} className="sm:flex-1">
          Menüye Dön
        </Button>
      </div>
    </div>
  );
}
