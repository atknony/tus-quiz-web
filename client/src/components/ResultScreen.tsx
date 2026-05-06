import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useGameState } from '@/hooks/useGameState';
import {
  formatTime,
  calculateFinalScore,
  calculateAccuracyRate,
  calculateAvgTimePerQuestion,
  getDifficultyName,
} from '@/lib/gameLogic';

export default function ResultScreen() {
  const { state, playAgain, returnToMenu } = useGameState();
  const { correctAnswers, wrongAnswers, totalTime, maxStreak, categoryPerformance, mode } = state;
  const [isSaving, setIsSaving] = useState(false);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const totalQuestions = correctAnswers + wrongAnswers;
  const finalScore = calculateFinalScore(state);
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
      const canvas = await html2canvas(resultCardRef.current);
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
    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
      <div ref={resultCardRef}>
        <h2 className="text-2xl font-bold text-center mb-2">Oyun Bitti</h2>
        <p className="text-center text-gray-600 mb-6">Maksimum yanlış cevap sayısına ulaştınız</p>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-center text-blue-800 mb-4">Son Skor</h3>

          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Toplam Soru:</span>
            <span className="font-bold">{totalQuestions}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Doğru Cevaplar:</span>
            <span className="font-bold text-green-600">{correctAnswers}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Yanlış Cevaplar:</span>
            <span className="font-bold text-red-600">{wrongAnswers}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Cevaplama Süresi:</span>
            <span className="font-bold font-mono">{formatTime(totalTime)}</span>
          </div>

          <div className="border-t border-blue-200 mt-4 pt-4 flex justify-between items-center">
            <span className="text-gray-800 font-semibold">Son Skor:</span>
            <span className="font-bold text-xl font-mono">{formatTime(finalScore)}</span>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-center mb-3">Performans Özeti</h3>

          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Zorluk Seviyesi:</span>
            <span className="font-medium">{getDifficultyName(state.difficulty)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Doğruluk Oranı:</span>
            <span className="font-medium">{accuracyRate}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Soru Başına Ortalama Süre:</span>
            <span className="font-medium font-mono">{avgTimePerQuestion}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Maksimum Seri:</span>
            <span className="font-medium">{maxStreak} doğru</span>
          </div>
        </div>

        {mode === 'competitive' && sortedCategories.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold text-center text-indigo-800 mb-3">Kategori Performansı</h3>
            <p className="text-xs text-center text-gray-500 mb-3">En düşük doğruluk oranından en yükseğe sıralanmıştır</p>
            <div className="space-y-2">
              {sortedCategories.map(({ category, correct, total, accuracy }) => (
                <div key={category} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-40 truncate" title={category}>{category}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${accuracy >= 70 ? 'bg-green-500' : accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-600 w-20 text-right">
                    {correct}/{total} ({accuracy}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex-1"
          onClick={saveScreenshot}
          disabled={isSaving}
        >
          {isSaving ? 'Kaydediliyor...' : 'Ekran Görüntüsünü Kaydet'}
        </button>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          onClick={playAgain}
        >
          Tekrar Oyna
        </button>
        <button
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded-lg font-medium transition-colors"
          onClick={returnToMenu}
        >
          Mod Seçimine Dön
        </button>
      </div>
    </div>
  );
}