import { useState } from "react";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGameState } from "@/hooks/useGameState";
import AuthModal from "@/components/auth/AuthModal";

const GAMEPLAY_SCREENS = new Set(["game", "feedback", "result"]);

export default function Header() {
  const { user, isLoading, logout } = useAuth();
  const { state } = useGameState();
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"login" | "register">("login");

  const isPlaying = GAMEPLAY_SCREENS.has(state.currentScreen);

  const openLogin = () => {
    setDefaultTab("login");
    setModalOpen(true);
  };

  const openRegister = () => {
    setDefaultTab("register");
    setModalOpen(true);
  };

  return (
    <header className="flex items-center justify-end gap-2 mb-4 min-h-[36px]">
      {!isLoading && (
        user ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span className="font-medium">{user.username}</span>
            </span>
            {!isPlaying && (
              <Button variant="outline" size="sm" onClick={() => logout()}>
                <LogOut className="w-4 h-4 mr-1.5" />
                Çıkış
              </Button>
            )}
          </div>
        ) : !isPlaying ? (
          <>
            <Button variant="outline" size="sm" onClick={openLogin}>
              Giriş Yap
            </Button>
            <Button size="sm" onClick={openRegister}>
              Kayıt Ol
            </Button>
          </>
        ) : null
      )}
      <AuthModal open={modalOpen} onOpenChange={setModalOpen} defaultTab={defaultTab} />
    </header>
  );
}
