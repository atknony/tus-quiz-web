import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Search, UserPlus, UserMinus, Check, X, Users } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

  // Build lookup maps for deriving button state from search results
  const friendIds = new Set(friends.map(f => f.id));
  const sentMap = new Map(sent.map(r => [r.otherUser.id, r.id]));
  const receivedMap = new Map(received.map(r => [r.otherUser.id, r.id]));

  const hasPendingSection = sent.length > 0 || received.length > 0;

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'mode' })}
        >
          <ChevronLeft className="w-4 h-4" />
          Mod Seçimi
        </button>
        <h1 className="text-2xl font-bold">Arkadaşlarım</h1>
        <span className="w-20" />
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="w-4 h-4" />
            Kullanıcı Ara
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Kullanıcı adı ile ara..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          {debouncedQ.length >= 2 && (
            <div className="space-y-2">
              {searchQuery.isLoading && <p className="text-sm text-gray-500">Aranıyor...</p>}
              {searchResults.length === 0 && !searchQuery.isLoading && (
                <p className="text-sm text-gray-500">Kullanıcı bulunamadı.</p>
              )}
              {searchResults.map(u => {
                const isFriend = friendIds.has(u.id);
                const sentId = sentMap.get(u.id);
                const receivedId = receivedMap.get(u.id);

                return (
                  <div key={u.id} className="flex items-center justify-between p-2 border border-gray-100 rounded-lg">
                    <div>
                      <div className="text-sm font-medium">{u.username}</div>
                      <div className="text-xs text-gray-500">{u.university}</div>
                    </div>
                    <div className="flex gap-2">
                      {isFriend ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFriend.mutate(u.id)}
                          disabled={removeFriend.isPending}
                        >
                          <UserMinus className="w-3.5 h-3.5 mr-1" />
                          Kaldır
                        </Button>
                      ) : sentId !== undefined ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRequest.mutate(sentId)}
                          disabled={deleteRequest.isPending}
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          İptal Et
                        </Button>
                      ) : receivedId !== undefined ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => acceptRequest.mutate(receivedId)}
                            disabled={acceptRequest.isPending}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Kabul Et
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRequest.mutate(receivedId)}
                            disabled={deleteRequest.isPending}
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Reddet
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => sendRequest.mutate(u.id)}
                          disabled={sendRequest.isPending}
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          İstek Gönder
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {hasPendingSection && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bekleyen İstekler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {received.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gelen İstekler</div>
                {received.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 border border-gray-100 rounded-lg">
                    <div>
                      <div className="text-sm font-medium">{r.otherUser.username}</div>
                      <div className="text-xs text-gray-500">{r.otherUser.university}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptRequest.mutate(r.id)}
                        disabled={acceptRequest.isPending}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Kabul Et
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRequest.mutate(r.id)}
                        disabled={deleteRequest.isPending}
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Reddet
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {sent.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gönderilen İstekler</div>
                {sent.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 border border-gray-100 rounded-lg">
                    <div>
                      <div className="text-sm font-medium">{r.otherUser.username}</div>
                      <div className="text-xs text-gray-500">{r.otherUser.university}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRequest.mutate(r.id)}
                      disabled={deleteRequest.isPending}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      İptal Et
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Friends List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Arkadaş Listesi
            {friends.length > 0 && (
              <span className="text-sm font-normal text-gray-500">({friends.length})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {friendsQuery.isLoading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
          {!friendsQuery.isLoading && friends.length === 0 && (
            <p className="text-center text-gray-500 py-6 text-sm">
              Henüz hiç arkadaşın yok. Birini arayarak başla!
            </p>
          )}
          <div className="space-y-2">
            {friends.map(f => (
              <div key={f.friendshipId} className="flex items-center justify-between p-2 border border-gray-100 rounded-lg">
                <div>
                  <div className="text-sm font-medium">{f.username}</div>
                  <div className="text-xs text-gray-500">{f.university}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch({ type: 'VIEW_USER', payload: f.id })}
                  >
                    Profili Gör
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFriend.mutate(f.id)}
                    disabled={removeFriend.isPending}
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
