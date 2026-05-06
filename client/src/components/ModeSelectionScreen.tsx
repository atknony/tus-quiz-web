import { Shield, Trophy } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/hooks/useAuthModal';

export default function ModeSelectionScreen() {
  const { selectMode } = useGameState();
  const { user } = useAuth();
  const { open: openModal } = useAuthModal();

  const handleCompetitive = () => {
    if (user) {
      selectMode('competitive');
    } else {
      openModal('login');
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          TUS Quiz Oyunu
        </h1>
        <p className="text-lg text-gray-600">Bir mod seçin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Practice mode */}
        <div
          className="p-6 rounded-xl border-2 border-green-200 hover:border-green-500 bg-gradient-to-br from-green-50 to-white shadow-md hover:shadow-lg cursor-pointer transition-all"
          onClick={() => selectMode('practice')}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-green-700">Pratik Mod</h2>
          </div>
          <p className="text-gray-600 text-sm">Giriş gerektirmez.</p>
          <p className="text-amber-700 text-sm mt-1 font-medium">Bu modda hiçbir veri kaydedilmez.</p>
        </div>

        {/* Competitive mode */}
        <div
          className="p-6 rounded-xl border-2 border-blue-200 hover:border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-md hover:shadow-lg cursor-pointer transition-all"
          onClick={handleCompetitive}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-blue-700">Rekabet Modu</h2>
          </div>
          <p className="text-gray-600 text-sm">Skor ve istatistikler kaydedilir.</p>
          {!user && (
            <p className="text-amber-700 text-sm mt-1 font-medium">Giriş yapmanız gerekir.</p>
          )}
        </div>
      </div>
    </div>
  );
}
