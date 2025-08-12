import React, { useMemo } from 'react';
import { Clock, Zap, Ban } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { Difficulty } from '@/lib/types';
import { getMaxTime } from '@/lib/gameLogic';

type CardProps = {
  label: string;
  difficulty: Difficulty;
  gradient: string;   // tailwind gradient classes
  border: string;     // tailwind border classes
  iconColor: string;  // tailwind color classes
  disabled?: boolean;
  onSelect: (d: Difficulty) => void;
};

function DifficultyCard({
  label, difficulty, gradient, border, iconColor, disabled, onSelect,
}: CardProps) {
  const perQuestion = useMemo(() => getMaxTime(difficulty), [difficulty]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(difficulty)}
      className={`text-left rounded-xl shadow-md p-6 transition-all hover:shadow-lg w-full
        ${gradient} ${border}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-opacity-80'}
      `}
    >
      <h3 className={`font-bold text-xl mb-3 ${iconColor}`}>{label}</h3>
      <ul className="text-sm text-gray-700 space-y-3">
        <li className="flex items-center">
          <Clock className={`h-5 w-5 mr-2 ${iconColor}`} />
          <span>Soru başına {perQuestion} saniye</span>
        </li>
        <li className="flex items-center">
          <Ban className={`h-5 w-5 mr-2 ${iconColor}`} />
          <span>Ceza yok</span>
        </li>
        <li className="flex items-center">
          <Zap className={`h-5 w-5 mr-2 ${iconColor}`} />
          <span>
            {difficulty === 'easy' ? 'Yeni başlayanlar'
              : difficulty === 'medium' ? 'Orta seviye'
              : 'Sınava hazır'}
            {' '}için
          </span>
        </li>
      </ul>
    </button>
  );
}

export default function DifficultyScreen() {
  const { state, startGame } = useGameState();
  const sectionLabel = state.section === 'klinik' ? 'Klinik Tıp' : 'Preklinik';
  const disabled = !state.section; // bölüm seçilmediyse tıklanmasın

  const handleDifficultySelect = (difficulty: Difficulty) => {
    if (!disabled) startGame(difficulty); // useGameState backend’e 1/2/3 map’liyor
  };

  return (
    <div className="container max-w-3xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          Zorluk Seviyesini Seçin
        </h1>
        <p className="text-xl text-gray-600">
          {sectionLabel} bölümü için zorluk seviyesini seçin
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        <DifficultyCard
          label="Kolay"
          difficulty="easy"
          gradient="bg-gradient-to-br from-blue-50 to-white"
          border="border-2 border-blue-200 hover:border-blue-500"
          iconColor="text-blue-600"
          disabled={disabled}
          onSelect={handleDifficultySelect}
        />

        <DifficultyCard
          label="Orta"
          difficulty="medium"
          gradient="bg-gradient-to-br from-amber-50 to-white"
          border="border-2 border-amber-200 hover:border-amber-500"
          iconColor="text-amber-600"
          disabled={disabled}
          onSelect={handleDifficultySelect}
        />

        <DifficultyCard
          label="Zor"
          difficulty="expert"
          gradient="bg-gradient-to-br from-red-50 to-white"
          border="border-2 border-red-200 hover:border-red-500"
          iconColor="text-red-600"
          disabled={disabled}
          onSelect={handleDifficultySelect}
        />
      </div>
    </div>
  );
}
