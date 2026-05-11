import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Search, UserPlus, UserMinus, Check, X, Users, Eye, AlertCircle } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { EmptyState } from '@/components/ui/empty-state';

interface UserPublic {
  id: number;
  username: string;
  university: string;
}

interface FriendWithProfile {
  friendshipId: number;
  id: number;
  username: string;
  university: string;
}

interface FriendshipWithUser {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: string;
  createdAt: string;
  otherUser: UserPublic;
}

interface PendingRequests {
  sent: FriendshipWithUser[];
  received: FriendshipWithUser[];
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function FriendsScreen() {
  const { dispatch } = useGameState();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const debouncedQ = useDebounce(searchInput, 300);

  const friendsQuery = useQuery<FriendWithProfile[]>({
    queryKey: ['/api/friends'],
    queryFn: async () => (await apiRequest('GET', '/api/friends')).json(),
    staleTime: 30_000,
  });

  const requestsQuery = useQuery<PendingRequests>({
    queryKey: ['/api/friends/requests'],
    queryFn: async () => (await apiRequest('GET', '/api/friends/requests')).json(),
    staleTime: 30_000,
  });

  const searchQuery = useQuery<UserPublic[]>({
    queryKey: ['/api/friends/search', debouncedQ],
    queryFn: async () => (await apiRequest('GET', `/api/friends/search?q=${encodeURIComponent(debouncedQ)}`)).json(),
    enabled: debouncedQ.length >= 2,
    staleTime: 15_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['/api/friends'] });
    qc.invalidateQueries({ queryKey: ['/api/friends/requests'] });
    qc.invalidateQueries({ queryKey: ['/api/friends/search'] });
    qc.invalidateQueries({ queryKey: ['/api/leaderboard'] });
  };

  const sendRequest = useMutation({
    mutationFn: (addresseeId: number) => apiRequest('POST', '/api/friends/request', { addresseeId }),
    onSuccess: invalidate,
  });
  const acceptRequest = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/friends/requests/${id}/accept`, {}),
    onSuccess: invalidate,
  });
  const deleteRequest = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/friends/requests/${id}`),
    onSuccess: invalidate,
  });
  const removeFriend = useMutation({
    mutationFn: (friendId: number) => apiRequest('DELETE', `/api/friends/${friendId}`),
    onSuccess: invalidate,
  });

  const friends = friendsQuery.data ?? [];
  const sent = requestsQuery.data?.sent ?? [];
  const received = requestsQuery.data?.received ?? [];
  const searchResults = searchQuery.data ?? [];

  const friendIds = new Set(friends.map(f => f.id));
  const sentMap = new Map(sent.map(r => [r.otherUser.id, r.id]));
  const receivedMap = new Map(received.map(r => [r.otherUser.id, r.id]));

  const hasPendingSection = sent.length > 0 || received.length > 0;
  const pendingCount = sent.length + received.length;

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
          <div className="text-eyebrow text-muted-foreground">Sosyal</div>
          <h1 className="font-serif text-h1 text-foreground mt-1">Arkadaşlarım</h1>
        </div>
      </div>

      {/* Search */}
      <SurfaceCard padding="md">
        <div className="text-eyebrow text-muted-foreground mb-3">Kullanıcı Ara</div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-soft pointer-events-none" />
          <Input
            placeholder="Kullanıcı adı ile ara..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="pl-9 h-10 bg-background border-border focus-visible:border-border-strong"
          />
        </div>

        {debouncedQ.length >= 2 && (
          <div className="mt-3">
            {searchQuery.isLoading && <p className="text-caption text-muted-foreground">Aranıyor...</p>}
            {searchResults.length === 0 && !searchQuery.isLoading && (
              <p className="text-caption text-muted-foreground">Kullanıcı bulunamadı.</p>
            )}
            <ul className="divide-y divide-border">
              {searchResults.map(u => {
                const isFriend = friendIds.has(u.id);
                const sentId = sentMap.get(u.id);
                const receivedId = receivedMap.get(u.id);

                return (
                  <li key={u.id} className="flex items-center gap-3 py-3">
                    <UserInfo username={u.username} university={u.university} />
                    <div className="flex items-center gap-1 shrink-0">
                      {isFriend ? (
                        <IconAction
                          label="Arkadaşlıktan Çıkar"
                          icon={<UserMinus />}
                          onClick={() => removeFriend.mutate(u.id)}
                          disabled={removeFriend.isPending}
                        />
                      ) : sentId !== undefined ? (
                        <SemanticBadge tone="warning" size="sm">İstek Gönderildi</SemanticBadge>
                      ) : receivedId !== undefined ? (
                        <>
                          <IconAction
                            label="Kabul Et"
                            icon={<Check />}
                            primary
                            onClick={() => acceptRequest.mutate(receivedId)}
                            disabled={acceptRequest.isPending}
                          />
                          <IconAction
                            label="Reddet"
                            icon={<X />}
                            onClick={() => deleteRequest.mutate(receivedId)}
                            disabled={deleteRequest.isPending}
                          />
                        </>
                      ) : (
                        <IconAction
                          label="İstek Gönder"
                          icon={<UserPlus />}
                          primary
                          onClick={() => sendRequest.mutate(u.id)}
                          disabled={sendRequest.isPending}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </SurfaceCard>

      {/* Pending Requests */}
      {hasPendingSection && (
        <SurfaceCard padding="md">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-eyebrow text-muted-foreground">Bekleyen İstekler</div>
            <SemanticBadge tone="warning" size="sm">{pendingCount}</SemanticBadge>
          </div>

          {received.length > 0 && (
            <div className="mb-4 last:mb-0">
              <div className="text-caption text-muted-soft mb-2">Gelen</div>
              <ul className="divide-y divide-border">
                {received.map(r => (
                  <li key={r.id} className="flex items-center gap-3 py-3">
                    <UserInfo username={r.otherUser.username} university={r.otherUser.university} />
                    <div className="flex items-center gap-1 shrink-0">
                      <IconAction
                        label="Kabul Et"
                        icon={<Check />}
                        primary
                        onClick={() => acceptRequest.mutate(r.id)}
                        disabled={acceptRequest.isPending}
                      />
                      <IconAction
                        label="Reddet"
                        icon={<X />}
                        onClick={() => deleteRequest.mutate(r.id)}
                        disabled={deleteRequest.isPending}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sent.length > 0 && (
            <div>
              <div className="text-caption text-muted-soft mb-2">Gönderilen</div>
              <ul className="divide-y divide-border">
                {sent.map(r => (
                  <li key={r.id} className="flex items-center gap-3 py-3">
                    <UserInfo username={r.otherUser.username} university={r.otherUser.university} />
                    <div className="flex items-center gap-1 shrink-0">
                      <IconAction
                        label="İptal Et"
                        icon={<X />}
                        onClick={() => deleteRequest.mutate(r.id)}
                        disabled={deleteRequest.isPending}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SurfaceCard>
      )}

      {/* Friends List */}
      <SurfaceCard padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="text-eyebrow text-muted-foreground">Arkadaş Listesi</div>
          {friends.length > 0 && (
            <span className="text-caption text-muted-soft tabular-nums">{friends.length}</span>
          )}
        </div>

        {friendsQuery.isLoading && (
          <p className="text-caption text-muted-foreground">Yükleniyor...</p>
        )}
        {!friendsQuery.isLoading && friends.length === 0 && (
          <EmptyState
            icon={<Users />}
            title="Henüz arkadaş yok"
            description="Birini arayarak başla."
          />
        )}

        <ul className="divide-y divide-border">
          {friends.map(f => (
            <li key={f.friendshipId} className="flex items-center gap-3 py-3">
              <UserInfo username={f.username} university={f.university} />
              <div className="flex items-center gap-1 shrink-0">
                <IconAction
                  label="Profili Gör"
                  icon={<Eye />}
                  onClick={() => dispatch({ type: 'VIEW_USER', payload: f.id })}
                />
                <IconAction
                  label="Arkadaşlıktan Çıkar"
                  icon={<UserMinus />}
                  onClick={() => removeFriend.mutate(f.id)}
                  disabled={removeFriend.isPending}
                />
              </div>
            </li>
          ))}
        </ul>
      </SurfaceCard>
    </div>
  );
}

function UserInfo({ username, university }: { username: string; university: string }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="text-body text-foreground truncate">{username}</div>
      <div className="text-caption text-muted-foreground truncate">{university}</div>
    </div>
  );
}

function IconAction({
  label,
  icon,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={primary ? 'default' : 'ghost'}
          size="icon"
          className="h-9 w-9"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
