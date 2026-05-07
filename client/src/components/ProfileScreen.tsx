import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  Trophy,
  Target,
  Flame,
  Award,
  AlertCircle,
  Mail,
  Cake,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGameState } from '@/hooks/useGameState';
import { apiRequest } from '@/lib/queryClient';
import { formatTime, getDifficultyName } from '@/lib/gameLogic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Difficulty } from '@/lib/types';

interface ProfileStats {
  totalGames: number;
  totalCorrect: number;
  totalWrong: number;
  accuracyRate: number;
  maxStreakEver: number;
  strongestCategory: string | null;
  weakestCategory: string | null;
}

interface ProfileResponse {
  id: number;
  username: string;
  university: string;
  createdAt: string;
  stats: ProfileStats;
  email?: string;
  dateOfBirth?: string;
}

interface MatchRow {
  id: number;
  difficulty: string;
  section: string;
  correctAnswers: number;
  wrongAnswers: number;
  totalTime: number;
  finalScore: number;
  maxStreak: number;
  totalQuestionsAnswered: number;
  accuracyRate: number;
  avgTimePerQuestion: number;
  categoryPerformance: Record<string, { correct: number; wrong: number }>;
  startedAt: string;
  completedAt: string | null;
}

interface MatchHistoryResponse {
  games: MatchRow[];
  hasMore: boolean;
}

const PAGE_SIZE = 20;

export default function ProfileScreen() {
  const { user } = useAuth();
  const { dispatch } = useGameState();

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-700">Profilinizi görmek için giriş yapmalısınız.</p>
        <Button
          className="mt-4"
          onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'mode' })}
        >
          Mod Seçimine Dön
        </Button>
      </div>
    );
  }

  return <ProfileContent userId={user.id} />;
}

function ProfileContent({ userId }: { userId: number }) {
  const { dispatch } = useGameState();

  const profileQuery = useQuery<ProfileResponse>({
    queryKey: ['/api/users', userId, 'profile'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/users/${userId}/profile`);
      return res.json();
    },
  });

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  async function loadPage(currentOffset: number) {
    setLoadingMore(true);
    setHistoryError(null);
    try {
      const res = await apiRequest(
        'GET',
        `/api/users/${userId}/games?limit=${PAGE_SIZE}&offset=${currentOffset}`,
      );
      const data: MatchHistoryResponse = await res.json();
      setMatches((prev) => (currentOffset === 0 ? data.games : [...prev, ...data.games]));
      setHasMore(data.hasMore);
    } catch (e) {
      setHistoryError(e instanceof Error ? e.message : 'Yüklenemedi.');
    } finally {
      setLoadingMore(false);
      setInitialized(true);
    }
  }

  useEffect(() => {
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const profile = profileQuery.data;
  const stats = profile?.stats;

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
        <h1 className="text-2xl font-bold">Profilim</h1>
        <span className="w-20" />
      </div>

      {profileQuery.isLoading && (
        <p className="text-center text-gray-500">Yükleniyor...</p>
      )}
      {profileQuery.isError && (
        <Card>
          <CardContent className="p-4 text-red-600 text-sm">
            Profil bilgileri yüklenemedi.
          </CardContent>
        </Card>
      )}

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{profile.username}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              {profile.university}
            </div>
            {profile.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                {profile.email}
              </div>
            )}
            {profile.dateOfBirth && (
              <div className="flex items-center gap-2">
                <Cake className="w-4 h-4 text-gray-400" />
                {profile.dateOfBirth}
              </div>
            )}
            <div className="text-xs text-gray-400 pt-2">
              Üyelik: {new Date(profile.createdAt).toLocaleDateString('tr-TR')}
            </div>
          </CardContent>
        </Card>
      )}

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Yaşam Boyu İstatistikler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatTile icon={<Trophy />} label="Toplam Maç" value={String(stats.totalGames)} />
              <StatTile icon={<Target />} label="Doğruluk" value={`${stats.accuracyRate.toFixed(1)}%`} />
              <StatTile icon={<Flame />} label="En Uzun Seri" value={String(stats.maxStreakEver)} />
              <StatTile icon={<Award />} label="En Güçlü" value={stats.strongestCategory ?? '—'} compact />
              <StatTile icon={<AlertCircle />} label="En Zayıf" value={stats.weakestCategory ?? '—'} compact />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Geçmiş Maçlar</CardTitle>
        </CardHeader>
        <CardContent>
          {historyError && (
            <p className="text-red-600 text-sm mb-3">{historyError}</p>
          )}
          {initialized && matches.length === 0 && !historyError && (
            <p className="text-center text-gray-500 py-6">
              Henüz tamamlanmış rekabetli maç yok. Bir maç oynamayı dene!
            </p>
          )}
          <div className="space-y-3">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => loadPage(matches.length)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3">
      <div className="text-blue-500 [&>svg]:w-5 [&>svg]:h-5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className={`font-bold ${compact ? 'text-sm truncate' : 'text-lg'}`} title={compact ? value : undefined}>
          {value}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: MatchRow }) {
  const totalAnswered = match.correctAnswers + match.wrongAnswers;
  const dateSource = match.completedAt ?? match.startedAt;
  const date = new Date(dateSource).toLocaleString('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const sortedCategories = Object.entries(match.categoryPerformance)
    .map(([cat, s]) => {
      const total = s.correct + s.wrong;
      return {
        category: cat,
        correct: s.correct,
        total,
        accuracy: total > 0 ? Math.round((s.correct / total) * 100) : 0,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);

  const sectionLabel =
    match.section === 'klinik' ? 'Klinik' : match.section === 'preklinik' ? 'Preklinik' : match.section;
  const difficultyLabel = getDifficultyName(match.difficulty as Difficulty) || match.difficulty;

  return (
    <details className="border border-gray-200 rounded-lg">
      <summary className="cursor-pointer p-3 flex flex-wrap items-center justify-between gap-2 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{sectionLabel}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{difficultyLabel}</span>
        </div>
        <div className="flex items-center gap-3 text-sm font-mono">
          <span className="text-green-600">{match.correctAnswers}D</span>
          <span className="text-red-600">{match.wrongAnswers}Y</span>
          <span className="text-gray-600">{formatTime(match.totalTime)}</span>
        </div>
        <span className="text-xs text-gray-500 w-full sm:w-auto">{date}</span>
      </summary>
      <div className="px-3 pb-3 pt-2 text-sm border-t border-gray-100">
        <div className="grid grid-cols-2 gap-2 mb-3 text-gray-700">
          <div>Toplam Cevap: <span className="font-semibold">{totalAnswered}</span></div>
          <div>Doğruluk: <span className="font-semibold">{match.accuracyRate.toFixed(1)}%</span></div>
          <div>Max Seri: <span className="font-semibold">{match.maxStreak}</span></div>
          <div>Ort. Süre/Soru: <span className="font-semibold font-mono">{formatTime(match.avgTimePerQuestion)}</span></div>
        </div>
        {sortedCategories.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500 mb-1">Kategori Performansı</div>
            {sortedCategories.map(({ category, correct, total, accuracy }) => (
              <div key={category} className="flex items-center gap-2">
                <span className="text-xs text-gray-700 w-32 truncate" title={category}>
                  {category}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      accuracy >= 70 ? 'bg-green-500' : accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-600 w-16 text-right">
                  {correct}/{total} ({accuracy}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
