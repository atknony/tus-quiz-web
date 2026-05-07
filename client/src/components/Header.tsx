import { LogOut, User, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGameState } from "@/hooks/useGameState";
import { useAuthModal } from "@/hooks/useAuthModal";

const GAMEPLAY_SCREENS = new Set(["game", "feedback", "result"]);

export default function Header() {
  const { user, isLoading, logout } = useAuth();
  const { state, dispatch } = useGameState();
  const { open: openModal } = useAuthModal();

  const isPlaying = GAMEPLAY_SCREENS.has(state.currentScreen);
  const isOnProfile = state.currentScreen === 'profile';

  return (
    <header className="flex items-center justify-end gap-2 mb-4 min-h-[36px]">
      {!isLoading && (
        user ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span className="font-medium">{user.username}</span>
            </span>
            {!isPlaying && !isOnProfile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'profile' })}
              >
                <UserCircle className="w-4 h-4 mr-1.5" />
                Profilim
              </Button>
            )}
            {!isPlaying && (
              <Button variant="outline" size="sm" onClick={() => logout()}>
                <LogOut className="w-4 h-4 mr-1.5" />
                Çıkış
              </Button>
            )}
          </div>
        ) : !isPlaying ? (
          <>
            <Button variant="outline" size="sm" onClick={() => openModal('login')}>
              Giriş Yap
            </Button>
            <Button size="sm" onClick={() => openModal('register')}>
              Kayıt Ol
            </Button>
          </>
        ) : null
      )}
    </header>
  );
}
