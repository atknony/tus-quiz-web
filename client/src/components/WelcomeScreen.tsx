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
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">TUS Quiz Oyunu</h1>
      <p className="text-gray-600 mb-8 text-center">Tıpta Uzmanlık Sınavı için bilgilerinizi test edin</p>
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Zorluk Seviyesini Seçin</h2>
        
        {/* Difficulty selection cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Easy mode */}
          <div 
            className="bg-blue-50 border-2 border-blue-200 hover:border-blue-500 rounded-lg p-4 cursor-pointer transition-all"
            onClick={() => handleDifficultySelect('easy')}
          >
            <h3 className="font-bold text-lg text-blue-700 mb-2">Kolay</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-blue-500" />
                Soru başına 120 saniye
              </li>
              <li className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-blue-500" />
                Hata başına +120s ceza
              </li>
              <li className="flex items-center">
                <Zap className="h-4 w-4 mr-1 text-blue-500" />
                Yeni başlayanlar için
              </li>
            </ul>
          </div>
          
          {/* Medium mode */}
          <div 
            className="bg-amber-50 border-2 border-amber-200 hover:border-amber-500 rounded-lg p-4 cursor-pointer transition-all"
            onClick={() => handleDifficultySelect('medium')}
          >
            <h3 className="font-bold text-lg text-amber-700 mb-2">Orta</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-amber-500" />
                Soru başına 60 saniye
              </li>
              <li className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                Hata başına +60s ceza
              </li>
              <li className="flex items-center">
                <Zap className="h-4 w-4 mr-1 text-amber-500" />
                Orta seviye öğrenciler için
              </li>
            </ul>
          </div>
          
          {/* Expert mode */}
          <div 
            className="bg-red-50 border-2 border-red-200 hover:border-red-500 rounded-lg p-4 cursor-pointer transition-all"
            onClick={() => handleDifficultySelect('expert')}
          >
            <h3 className="font-bold text-lg text-red-700 mb-2">Uzman</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-red-500" />
                Soru başına 30 saniye
              </li>
              <li className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                Hata başına +30s ceza
              </li>
              <li className="flex items-center">
                <Zap className="h-4 w-4 mr-1 text-red-500" />
                Sınava hazır öğrenciler için
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <h3 className="font-semibold mb-2">Oyun Kuralları:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Cevaplayabildiğiniz kadar soruyu yanıtlayın</li>
            <li>5 yanlış cevaptan sonra oyun biter</li>
            <li>Sorular süre dolmadan cevaplanmalıdır</li>
            <li>Düşük puan daha iyidir</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
