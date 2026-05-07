import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Trophy } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LeaderboardEntry {
  userId: number;
  username: string;
  masteryScore: number;
  totalGames: number;
  accuracyRate: number;
  maxStreakEver: number;
  isMe: boolean;
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { dispatch } = useGameState();
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard'],
    queryFn: async () => (await apiRequest('GET', '/api/leaderboard')).json(),
    staleTime: 60_000,
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-700">Bu sayfayı görmek için giriş yapmalısınız.</p>
        <Button className="mt-4" onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'mode' })}>
          Mod Seçimine Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'mode' })}
        >
          <ChevronLeft className="w-4 h-4" />
          Mod Seçimi
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          Sıralama
        </h1>
        <span className="w-20" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-normal text-gray-500">
            Sen ve arkadaşların arasındaki sıralama
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-center text-gray-500 py-6">Yükleniyor...</p>}
          {isError && <p className="text-center text-red-500 py-6 text-sm">Sıralama yüklenemedi.</p>}
          {data && data.length === 0 && (
            <p className="text-center text-gray-500 py-6 text-sm">
              Henüz tamamlanmış rekabetli maç yok. Bir maç oyna!
            </p>
          )}
          {data && data.length > 0 && (
            <div className="space-y-2">
              {data.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    entry.isMe
                      ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-400'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center shrink-0">
                    {index < 3 ? (
                      <span className="text-xl">{RANK_MEDALS[index]}</span>
                    ) : (
                      <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                    )}
                  </div>

                  {/* Username */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold truncate ${entry.isMe ? 'text-blue-700' : 'text-gray-900'}`}>
                        {entry.username}
                      </span>
                      {entry.isMe && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-200 text-blue-700 font-medium shrink-0">
                          Sen
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      <span>{entry.totalGames} maç</span>
                      <span>{entry.accuracyRate.toFixed(1)}% doğruluk</span>
                      <span>{entry.maxStreakEver} max seri</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <div className={`text-xl font-bold tabular-nums ${entry.isMe ? 'text-blue-700' : 'text-gray-800'}`}>
                      {entry.masteryScore.toLocaleString('tr-TR')}
                    </div>
                    <div className="text-xs text-gray-400">puan</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
