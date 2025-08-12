import { useEffect, useState } from 'react';
import { Clock, Zap, BookOpen, Ban } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { Section, Difficulty } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getMaxTime } from '@/lib/gameLogic';
import { apiRequest } from '@/lib/queryClient';

type Subject = { id: number; name: string };

export default function WelcomeScreen() {
  const { selectSection, startGame } = useGameState();
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest('GET', '/api/subjects/', undefined);
        const json = await res.json();
        const list: Subject[] = Array.isArray(json) ? json : (json.results ?? []);
        setSubjects(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasSubject = (name: string) =>
    subjects?.some(s => s.name.toLowerCase() === name.toLowerCase()) ?? false;

  const klinikAvailable = hasSubject('klinik');
  const preklinikAvailable = hasSubject('preklinik');

  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section);
    selectSection(section);
  };

  const handleStartGame = (difficulty: Difficulty) => {
    if (selectedSection) startGame(difficulty);
  };

  const EasySecs = getMaxTime('easy');
  const MedSecs  = getMaxTime('medium');
  const ExpSecs  = getMaxTime('expert');

  return (
    <div className="container max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          TUS Quiz Oyunu
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Tıpta Uzmanlık Sınavı için bilgilerinizi test edin
        </p>
      </div>

      {/* Bölüm seçimi */}
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Bölüm Seçin</CardTitle>
          <CardDescription>Çalışmak istediğiniz tıp alanını seçin</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Klinik */}
              <button
                type="button"
                disabled={!klinikAvailable}
                onClick={() => handleSectionSelect('klinik')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center w-full
                  ${selectedSection === 'klinik'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}
                  ${!klinikAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-4">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Klinik</h3>
                  <p className="text-sm text-gray-600">Klinik tıp alanı soruları</p>
                </div>
              </button>

              {/* Preklinik */}
              <button
                type="button"
                disabled={!preklinikAvailable}
                onClick={() => handleSectionSelect('preklinik')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center w-full
                  ${selectedSection === 'preklinik'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'}
                  ${!preklinikAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mr-4">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Preklinik</h3>
                  <p className="text-sm text-gray-600">Temel tıp bilimleri soruları</p>
                </div>
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zorluk seçimi */}
      {selectedSection && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Zorluk Seviyesi</CardTitle>
            <CardDescription>
              Zorluk sadece soruları cevaplamak için verilen süreyi belirler — <strong>ceza yok</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Kolay */}
              <button
                type="button"
                onClick={() => handleStartGame('easy')}
                className="text-left bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 hover:border-blue-500 rounded-xl shadow-md p-6 transition-all hover:shadow-lg"
              >
                <h3 className="font-bold text-xl text-blue-700 mb-3">Kolay</h3>
                <ul className="text-sm text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-500" />
                    <span>Soru başına {EasySecs} saniye</span>
                  </li>
                  <li className="flex items-center">
                    <Ban className="h-5 w-5 mr-2 text-blue-500" />
                    <span>Ceza yok</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-blue-500" />
                    <span>Yeni başlayanlar için</span>
                  </li>
                </ul>
              </button>

              {/* Orta */}
              <button
                type="button"
                onClick={() => handleStartGame('medium')}
                className="text-left bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 hover:border-amber-500 rounded-xl shadow-md p-6 transition-all hover:shadow-lg"
              >
                <h3 className="font-bold text-xl text-amber-700 mb-3">Orta</h3>
                <ul className="text-sm text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-amber-500" />
                    <span>Soru başına {MedSecs} saniye</span>
                  </li>
                  <li className="flex items-center">
                    <Ban className="h-5 w-5 mr-2 text-amber-500" />
                    <span>Ceza yok</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-amber-500" />
                    <span>Orta seviye öğrenciler için</span>
                  </li>
                </ul>
              </button>

              {/* Zor */}
              <button
                type="button"
                onClick={() => handleStartGame('expert')}
                className="text-left bg-gradient-to-br from-red-50 to-white border-2 border-red-200 hover:border-red-500 rounded-xl shadow-md p-6 transition-all hover:shadow-lg"
              >
                <h3 className="font-bold text-xl text-red-700 mb-3">Uzman</h3>
                <ul className="text-sm text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-red-500" />
                    <span>Soru başına {ExpSecs} saniye</span>
                  </li>
                  <li className="flex items-center">
                    <Ban className="h-5 w-5 mr-2 text-red-500" />
                    <span>Ceza yok</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-red-500" />
                    <span>Sınava hazır öğrenciler için</span>
                  </li>
                </ul>
              </button>
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
          <li>Doğru cevap sonrası 5 sn, yanlış cevap sonrası 15 sn geri bildirim</li>
          <li>Daha <b>düşük</b> toplam süre daha iyi skordur</li>
        </ul>
      </div>
    </div>
  );
}
