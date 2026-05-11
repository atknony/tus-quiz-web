import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Trophy, AlertCircle } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { SurfaceCard } from '@/components/ui/surface-card';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  userId: number;
  username: string;
  masteryScore: number;
  totalGames: number;
  accuracyRate: number;
  maxStreakEver: number;
  isMe: boolean;
}

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
      <SurfaceCard padding="lg">
        <EmptyState
          icon={<AlertCircle />}
          title="Giriş gerekli"
          description="Bu sayfayı görmek için giriş yapmalısınız."
          action={
            <Button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'mode' })}>
              Mod Seçimine Dön
            </Button>
          }
        />
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-3">
        <button
          onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'mode' })}
          className="inline-flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Mod Seçimi
        </button>
        <div>
          <div className="text-eyebrow text-muted-foreground">Performans</div>
          <h1 className="font-serif text-h1 text-foreground mt-1">Sıralama</h1>
          <p className="mt-1.5 text-caption text-muted-foreground">
            Sen ve arkadaşların arasındaki sıralama
          </p>
        </div>
      </div>

      <SurfaceCard padding="none">
        {isLoading && (
          <p className="text-center text-caption text-muted-foreground py-10">Yükleniyor...</p>
        )}
        {isError && (
          <p className="text-center text-caption text-danger py-10">Sıralama yüklenemedi.</p>
        )}
        {data && data.length === 0 && (
          <EmptyState
            icon={<Trophy />}
            title="Henüz veri yok"
            description="Henüz tamamlanmış rekabetli maç yok. Bir maç oyna!"
          />
        )}
        {data && data.length > 0 && (
          <ul className="divide-y divide-border">
            {data.map((entry, index) => (
              <li key={entry.userId}>
                <LeaderRow entry={entry} rank={index + 1} />
              </li>
            ))}
          </ul>
        )}
      </SurfaceCard>
    </div>
  );
}

function LeaderRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const isTop = rank <= 3;
  const rankLabel = String(rank).padStart(2, '0');

  return (
    <div
      className={cn(
        "flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5",
        entry.isMe && "bg-surface-sunken"
      )}
    >
      {/* Rank */}
      <div className="w-10 shrink-0 text-center">
        {isTop ? (
          <span className="font-serif text-h2 text-warning tabular-nums">{rankLabel}</span>
        ) : (
          <span className="text-caption text-muted-soft tabular-nums">#{rank}</span>
        )}
      </div>

      {/* Identity + sub-stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-body text-foreground truncate", entry.isMe && "font-medium")}>
            {entry.username}
          </span>
          {entry.isMe && <SemanticBadge tone="accent" size="sm">Sen</SemanticBadge>}
        </div>
        <div className="mt-0.5 text-caption text-muted-soft font-mono tabular-nums truncate">
          {entry.totalGames} maç
          <span className="mx-1.5">·</span>
          {entry.accuracyRate.toFixed(1)}%
          <span className="mx-1.5">·</span>
          {entry.maxStreakEver} max seri
        </div>
      </div>

      {/* Mastery score */}
      <div className="text-right shrink-0">
        <div className="font-serif text-h2 text-foreground tabular-nums">
          {entry.masteryScore.toLocaleString('tr-TR')}
        </div>
        <div className="text-caption text-muted-soft">puan</div>
      </div>
    </div>
  );
}
