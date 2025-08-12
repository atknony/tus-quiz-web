import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useGameState } from '@/hooks/useGameState';
import { 
  formatTime, 
  calculateFinalScore, 
  calculateAccuracyRate, 
  calculateAvgTimePerQuestion, 
  getDifficultyName 
} from '@/lib/gameLogic';

export default function ResultScreen() {
  const { state, playAgain, returnToMenu } = useGameState();
  const { correctAnswers, wrongAnswers, totalTime, section, difficulty } = state;
  const [isSaving, setIsSaving] = useState(false);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const totalQuestions = Math.max(0, correctAnswers + wrongAnswers);
  const finalScore = calculateFinalScore(state);
  const accuracyRate = calculateAccuracyRate(state);
  const avgTimePerQuestion = calculateAvgTimePerQuestion(state);

  const saveScreenshot = async () => {
    if (!resultCardRef.current) return;
    setIsSaving(true);
    try {
      const canvas = await html2canvas(resultCardRef.current);
      const imageUrl = canvas.toDataURL('image/png');

      const date = new Date().toISOString().split('T')[0];
      const fileName = `TUS-Quiz-${section ?? 'bolum'}-${difficulty ?? 'zorluk'}-${date}.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = imageUrl;
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
        <p className="text-center text-gray-600 mb-6">
          Maksimum yanlış cevap sayısına ulaştınız
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-center text-blue-800 mb-4">Son Skor</h3>

          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Bölüm:</span>
            <span className="font-medium capitalize">{section ?? '-'}</span>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Zorluk:</span>
            <span className="font-medium">{getDifficultyName(difficulty)}</span>
          </div>

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
            <span className="text-gray-600">Doğruluk Oranı:</span>
            <span className="font-medium">{accuracyRate}</span>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Soru Başına Ortalama Süre:</span>
            <span className="font-medium font-mono">{avgTimePerQuestion}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex-1"
          onClick={saveScreenshot}
          disabled={isSaving || totalQuestions === 0}
        >
          {isSaving ? 'Kaydediliyor...' : 'Ekran Görüntüsünü Kaydet'}
        </button>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          onClick={playAgain}
        >
          Tekrar Oyna
        </button>
        <button
          type="button"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded-lg font-medium transition-colors"
          onClick={returnToMenu}
        >
          Ana Menüye Dön
        </button>
      </div>
    </div>
  );
}
