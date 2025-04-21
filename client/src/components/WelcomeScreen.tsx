import { Clock, AlertTriangle, Zap, BookOpen } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { Section } from '@/lib/types';
import { Button } from '@/components/ui/button';

export default function WelcomeScreen() {
  const { selectSection } = useGameState();
  
  const handleSectionSelect = (section: Section) => {
    selectSection(section);
  };
  
  return (
    <div className="container max-w-3xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          TUS Quiz Oyunu
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Tıpta Uzmanlık Sınavı için bilgilerinizi test edin
        </p>
      </div>
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Çalışmaya Başlayın
            </h2>
            <p className="text-gray-600">
              Sınav hazırlığınız için uygun bölümü seçin ve bilgilerinizi test edin.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={() => handleSectionSelect('klinik')}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-medium"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Klinik Tıp
            </Button>
            
            <Button 
              onClick={() => handleSectionSelect('preklinik')}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-medium"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Preklinik
            </Button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <h3 className="font-semibold mb-3 text-gray-800">Oyun Kuralları:</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Cevaplayabildiğiniz kadar soruyu yanıtlayın</li>
          <li>5 yanlış cevaptan sonra oyun biter</li>
          <li>Sorular süre dolmadan cevaplanmalıdır</li>
          <li>Cevap süreleri zorluk seviyesine göre değişir</li>
          <li>Düşük puan daha iyidir</li>
        </ul>
      </div>
    </div>
  );
}
