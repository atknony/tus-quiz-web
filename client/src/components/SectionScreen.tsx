import React from 'react';
import { useGameState } from '@/hooks/useGameState';
import { Section } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SectionScreen() {
  const { selectSection } = useGameState();

  const handleSectionSelect = (section: Section) => {
    selectSection(section);
  };

  return (
    <div className="container max-w-3xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-indigo-500 text-transparent bg-clip-text">
        Bölüm Seçin
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <Card className="w-full shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-center">Klinik</CardTitle>
            <CardDescription className="text-center">
              Klinik tıp alanı soruları
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-4xl font-bold">K</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600"
              onClick={() => handleSectionSelect('klinik')}
            >
              Seç
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="w-full shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-center">Preklinik</CardTitle>
            <CardDescription className="text-center">
              Temel tıp bilimleri soruları
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <span className="text-white text-4xl font-bold">P</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
              onClick={() => handleSectionSelect('preklinik')}
            >
              Seç
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <p className="mt-8 text-center text-sm text-gray-500">
        Hazırlık yapmak istediğiniz alanı seçin. Her alan için farklı soru setleri sunulmaktadır.
      </p>
    </div>
  );
}