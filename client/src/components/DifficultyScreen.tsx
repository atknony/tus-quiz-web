import React from 'react';
import { Clock, AlertTriangle, Zap } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { Difficulty } from '@/lib/types';
import { getDifficultyName } from '@/lib/gameLogic';

export default function DifficultyScreen() {
  const { state, startGame } = useGameState();
  
  const handleDifficultySelect = (difficulty: Difficulty) => {
    startGame(difficulty);
  };
  
  return (
    <div className="container max-w-3xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          Zorluk Seviyesini Seçin
        </h1>
        <p className="text-xl text-gray-600">
          {state.section === 'klinik' ? 'Klinik Tıp' : 'Preklinik'} bölümü için zorluk seviyesini seçin
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        {/* Easy mode */}
        <div 
          className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 hover:border-blue-500 rounded-xl shadow-md p-6 cursor-pointer transition-all hover:shadow-lg"
          onClick={() => handleDifficultySelect('easy')}
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
          onClick={() => handleDifficultySelect('medium')}
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
          onClick={() => handleDifficultySelect('expert')}
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
    </div>
  );
}