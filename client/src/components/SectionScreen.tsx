import React, { useEffect, useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { Section } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

type Subject = { id: number; name: string };

export default function SectionScreen() {
  const { selectSection } = useGameState();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest('GET', '/api/subjects/', undefined);
        const json = await res.json();
        const list: Subject[] = Array.isArray(json) ? json : (json.results ?? []);
        setSubjects(list);
      } catch (e: any) {
        setErr(e?.message ?? 'Subjects yüklenemedi');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSectionSelect = (section: Section) => selectSection(section);

  const hasSubject = (name: string) =>
    subjects?.some(s => s.name.toLowerCase() === name.toLowerCase()) ?? false;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="container max-w-3xl mx-auto p-4 text-center">
        <p className="text-red-600 font-medium mb-4">{err}</p>
        <p className="text-sm text-gray-500">Lütfen backend’in çalıştığından emin olun.</p>
      </div>
    );
  }

  const klinikAvailable = hasSubject('klinik');
  const preklinikAvailable = hasSubject('preklinik');

  return (
    <div className="container max-w-3xl mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh]">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-indigo-500 text-transparent bg-clip-text">
        Bölüm Seçin
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Klinik */}
        <Card className="w-full shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-center">Klinik</CardTitle>
            <CardDescription className="text-center">Klinik tıp alanı soruları</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-4xl font-bold">K</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button
              size="lg"
              disabled={!klinikAvailable}
              className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleSectionSelect('klinik')}
            >
              {klinikAvailable ? 'Seç' : 'Mevcut değil'}
            </Button>
          </CardFooter>
        </Card>

        {/* Preklinik */}
        <Card className="w-full shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-center">Preklinik</CardTitle>
            <CardDescription className="text-center">Temel tıp bilimleri soruları</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <span className="text-white text-4xl font-bold">P</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button
              size="lg"
              disabled={!preklinikAvailable}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleSectionSelect('preklinik')}
            >
              {preklinikAvailable ? 'Seç' : 'Mevcut değil'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        Hazırlık yapmak istediğiniz alanı seçin. Seçenekler backend’deki bölüm kayıtlarına göre aktif edilir.
      </p>
    </div>
  );
}
