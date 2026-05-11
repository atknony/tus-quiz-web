import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  Trophy,
  Target,
  Flame,
  Award,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGameState } from '@/hooks/useGameState';
import { apiRequest } from '@/lib/queryClient';
import { formatTime, getDifficultyName } from '@/lib/gameLogic';
import { Button } from '@/components/ui/button';
import { SurfaceCard } from '@/components/ui/surface-card';
import { StatTile } from '@/components/ui/stat-tile';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
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
  const { state, dispatch } = useGameState();

  if (!user) {
    return (
      <SurfaceCard padding="lg">
        <EmptyState
          icon={<AlertCircle />}
          title="Giriş gerekli"
          description="Profilinizi görmek için giriş yapmalısınız."
          action={
            <Button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'mode' })}>
              Mod Seçimine Dön
            </Button>
          }
        />
      </SurfaceCard>
    );
  }

  const profileUserId = state.viewingUserId ?? user.id;
  const isViewingFriend = state.viewingUserId !== null;
  return <ProfileContent userId={profileUserId} isViewingFriend={isViewingFriend} />;
}

function ProfileContent({ userId, isViewingFriend }: { userId: number; isViewingFriend: boolean }) {
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-3">
        <button
          onClick={() => dispatch({ type: 'SET_SCREEN', payload: isViewingFriend ? 'friends' : 'mode' })}
          className="inline-flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {isViewingFriend ? 'Arkadaşlarım' : 'Mod Seçimi'}
        </button>
        <div>
          <div className="text-eyebrow text-muted-foreground">
            {isViewingFriend ? 'Arkadaş Profili' : 'Hesap'}
          </div>
          <h1 className="font-serif text-h1 text-foreground mt-1">
            {profile?.username ?? (isViewingFriend ? 'Profil' : 'Profilim')}
          </h1>
        </div>
      </div>

      {profileQuery.isLoading && (
        <p className="text-caption text-muted-foreground">Yükleniyor...</p>
      )}
      {profileQuery.isError && (
        <SurfaceCard tone="danger" variant="inset" padding="md">
          <p className="text-caption text-danger">Profil bilgileri yüklenemedi.</p>
        </SurfaceCard>
      )}

      {/* User info */}
      {profile && (
        <SurfaceCard padding="lg">
          <div className="text-eyebrow text-muted-foreground mb-4">Bilgiler</div>
          <dl className="divide-y divide-border">
            <InfoRow label="Üniversite" value={profile.university} />
            {profile.email && <InfoRow label="E-posta" value={profile.email} />}
            {profile.dateOfBirth && <InfoRow label="Doğum Tarihi" value={profile.dateOfBirth} />}
            <InfoRow
              label="Üyelik"
              value={new Date(profile.createdAt).toLocaleDateString('tr-TR')}
            />
          </dl>
        </SurfaceCard>
      )}

      {/* Stats */}
      {stats && (
        <SurfaceCard padding="lg">
          <div className="text-eyebrow text-muted-foreground mb-5">Yaşam Boyu İstatistikler</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
            <StatTile icon={<Trophy />} label="Toplam Maç" value={stats.totalGames} />
            <StatTile icon={<Target />} label="Doğruluk" value={`${stats.accuracyRate.toFixed(1)}%`} />
            <StatTile icon={<Flame />} label="En Uzun Seri" value={stats.maxStreakEver} />
            <CategoryTile
              icon={<Award />}
              label="En Güçlü"
              value={stats.strongestCategory ?? '—'}
              tone="success"
            />
            <CategoryTile
              icon={<AlertCircle />}
              label="En Zayıf"
              value={stats.weakestCategory ?? '—'}
              tone="danger"
            />
          </div>
        </SurfaceCard>
      )}

      {/* Match history */}
      <section>
        <div className="text-eyebrow text-muted-foreground mb-3">Geçmiş Maçlar</div>

        {historyError && (
          <SurfaceCard tone="danger" variant="inset" padding="sm" className="mb-3">
            <p className="text-caption text-danger">{historyError}</p>
          </SurfaceCard>
        )}

        {initialized && matches.length === 0 && !historyError && (
          <SurfaceCard padding="md">
            <EmptyState
              icon={<Trophy />}
              title="Henüz maç yok"
              description="Henüz tamamlanmış rekabetli maç yok. Bir maç oynamayı dene!"
            />
          </SurfaceCard>
        )}

        <div className="space-y-2">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>

        {hasMore && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPage(matches.length)}
              disabled={loadingMore}
            >
              {loadingMore ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="text-body text-foreground truncate text-right">{value}</dd>
    </div>
  );
}

function CategoryTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'success' | 'danger';
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
        <span className={cn("[&_svg]:w-3.5 [&_svg]:h-3.5", tone === 'success' ? 'text-success' : 'text-danger')}>
          {icon}
        </span>
        <span>{label}</span>
      </div>
      <div className="text-body text-foreground truncate" title={value}>
        {value}
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
    <details className="group rounded-2xl bg-surface border border-border hover:border-border-strong transition-colors [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer px-4 sm:px-5 py-3.5 flex items-center gap-3 list-none">
        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180 shrink-0" />
        <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <SemanticBadge tone="neutral" size="sm">{sectionLabel}</SemanticBadge>
          <SemanticBadge tone="warning" size="sm">{difficultyLabel}</SemanticBadge>
          <span className="text-caption text-muted-foreground tabular-nums font-mono ml-auto">
            {match.correctAnswers}<span className="text-muted-soft">D</span>
            <span className="mx-1 text-muted-soft">·</span>
            {match.wrongAnswers}<span className="text-muted-soft">Y</span>
            <span className="mx-1 text-muted-soft">·</span>
            {formatTime(match.totalTime)}
          </span>
        </div>
      </summary>
      <div className="px-4 sm:px-5 pb-4 pt-1 border-t border-border/60 space-y-4">
        <div className="text-caption text-muted-soft">{date}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-body">
          <Detail label="Toplam Cevap" value={totalAnswered} />
          <Detail label="Doğruluk" value={`${match.accuracyRate.toFixed(1)}%`} />
          <Detail label="Max Seri" value={match.maxStreak} />
          <Detail label="Ort. Süre" value={formatTime(match.avgTimePerQuestion)} mono />
        </div>
        {sortedCategories.length > 0 && (
          <div className="space-y-2">
            <div className="text-eyebrow text-muted-foreground">Kategori Performansı</div>
            {sortedCategories.map(({ category, correct, total, accuracy }) => (
              <div key={category} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-caption">
                  <span className="text-foreground truncate" title={category}>{category}</span>
                  <span className="font-mono tabular-nums text-muted-foreground shrink-0">
                    {correct}/{total} · {accuracy}%
                  </span>
                </div>
                <div className="h-1 bg-surface-sunken rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      accuracy >= 70 ? "bg-success" : accuracy >= 40 ? "bg-warning" : "bg-danger"
                    )}
                    style={{ width: `${Math.max(2, accuracy)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className={cn("text-body text-foreground tabular-nums", mono && "font-mono")}>{value}</span>
    </div>
  );
}
