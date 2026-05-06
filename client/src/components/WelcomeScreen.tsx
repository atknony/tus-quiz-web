import { useState } from 'react';
import { Clock, AlertTriangle, Zap, BookOpen, ChevronLeft, Shield, Trophy } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { Section, Difficulty } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function WelcomeScreen() {
  const { selectSection, startGame, returnToMenu, state } = useGameState();
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section);
    selectSection(section);
  };

  const handleStartGame = (difficulty: Difficulty) => {
    if (selectedSection) {
      startGame(difficulty);
    }
  };

  const isPractice = state.mode === 'practice';

  return (
    <div className="container max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
      {/* Mode badge + back button */}
      <div className="flex items-center justify-between w-full mb-4">
        <button
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          onClick={returnToMenu}
        >
          <ChevronLeft className="w-4 h-4" />
          Mod Seçimi
        </button>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
          isPractice
            ? 'bg-green-100 text-green-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {isPractice ? <Shield className="w-3 h-3" /> : <Trophy className="w-3 h-3" />}
          {isPractice ? 'Pratik Mod' : 'Rekabet Modu'}
        </span>
      </div>

      {/* Practice notice */}
      {isPractice && (
        <div className="w-full mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
          Pratik modu — bu oturumda hiçbir veri kaydedilmez.
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          TUS Quiz Oyunu
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Tıpta Uzmanlık Sınavı için bilgilerinizi test edin
        </p>
      </div>
      
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Bölüm Seçin</CardTitle>
          <CardDescription>
            Çalışmak istediğiniz tıp alanını seçin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center ${
                selectedSection === 'klinik' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
              onClick={() => handleSectionSelect('klinik')}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-4">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Klinik</h3>
                <p className="text-sm text-gray-600">Klinik tıp alanı soruları</p>
              </div>
            </div>
            
            <div 
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center ${
                selectedSection === 'preklinik' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
              onClick={() => handleSectionSelect('preklinik')}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mr-4">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Preklinik</h3>
                <p className="text-sm text-gray-600">Temel tıp bilimleri soruları</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {selectedSection && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Zorluk Seviyesi</CardTitle>
            <CardDescription>
              Zorluk seviyesi yalnızca soruları cevaplamak için olan süreyi belirler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Easy mode */}
              <div 
                className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 hover:border-blue-500 rounded-xl shadow-md p-6 cursor-pointer transition-all hover:shadow-lg"
                onClick={() => handleStartGame('easy')}
              >
                <h3 className="font-bold text-xl text-blue-700 mb-3">Kolay</h3>
                <ul className="text-sm text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-500" />
                    <span>Soru başına 120 saniye</span>
                  </li>
                  <li className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-blue-500" />
                    <span>Hata başına +120s ceza</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-blue-500" />
                    <span>Yeni başlayanlar için</span>
                  </li>
                </ul>
              </div>
              
              {/* Medium mode */}
              <div 
                className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 hover:border-amber-500 rounded-xl shadow-md p-6 cursor-pointer transition-all hover:shadow-lg"
                onClick={() => handleStartGame('medium')}
              >
                <h3 className="font-bold text-xl text-amber-700 mb-3">Orta</h3>
                <ul className="text-sm text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-amber-500" />
                    <span>Soru başına 60 saniye</span>
                  </li>
                  <li className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                    <span>Hata başına +60s ceza</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-amber-500" />
                    <span>Orta seviye öğrenciler için</span>
                  </li>
                </ul>
              </div>
              
              {/* Expert mode */}
              <div 
                className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 hover:border-red-500 rounded-xl shadow-md p-6 cursor-pointer transition-all hover:shadow-lg"
                onClick={() => handleStartGame('expert')}
              >
                <h3 className="font-bold text-xl text-red-700 mb-3">Uzman</h3>
                <ul className="text-sm text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-red-500" />
                    <span>Soru başına 30 saniye</span>
                  </li>
                  <li className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                    <span>Hata başına +30s ceza</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-red-500" />
                    <span>Sınava hazır öğrenciler için</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="mt-8 bg-white rounded-lg p-5 shadow w-full max-w-2xl">
        <h3 className="font-semibold mb-3 text-gray-800">Oyun Kuralları:</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Cevaplayabildiğiniz kadar soruyu yanıtlayın</li>
          <li>5 yanlış cevaptan sonra oyun biter</li>
          <li>Sorular süre dolmadan cevaplanmalıdır</li>
          <li>Doğru cevaplar için 5 sn, yanlış cevaplar için 15 sn geribildirim süresi</li>
          <li>Düşük puan daha iyidir</li>
        </ul>
      </div>
    </div>
  );
}