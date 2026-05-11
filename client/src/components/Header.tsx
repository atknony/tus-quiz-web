import { useState } from "react";
import { LogOut, Menu, User, UserCircle, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SemanticBadge } from "@/components/ui/semantic-badge";
import { useAuth } from "@/hooks/useAuth";
import { useGameState } from "@/hooks/useGameState";
import { useAuthModal } from "@/hooks/useAuthModal";
import { cn } from "@/lib/utils";

const GAMEPLAY_SCREENS = new Set(["game", "feedback", "result"]);

type NavTarget = "leaderboard" | "friends" | "profile";

interface NavItem {
  target: NavTarget;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { target: "leaderboard", label: "Sıralama", icon: Trophy },
  { target: "friends", label: "Arkadaşlarım", icon: Users },
  { target: "profile", label: "Profilim", icon: UserCircle },
];

export default function Header() {
  const { user, isLoading, logout } = useAuth();
  const { state, dispatch } = useGameState();
  const { open: openModal } = useAuthModal();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isPlaying = GAMEPLAY_SCREENS.has(state.currentScreen);
  const currentScreen = state.currentScreen;

  const go = (target: NavTarget) => {
    dispatch({ type: "SET_SCREEN", payload: target });
    setSheetOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    dispatch({ type: "RESET_GAME" });
    setSheetOpen(false);
  };

  if (isLoading) {
    return <header className="flex items-center justify-end gap-2 mb-6 min-h-[40px]" />;
  }

  return (
    <header className="flex items-center justify-between gap-3 mb-6 sm:mb-8 min-h-[40px]">
      <div className="flex items-center gap-2">
        {user && (
          <SemanticBadge tone="neutral" icon={<User />}>
            {user.username}
          </SemanticBadge>
        )}
      </div>

      {user ? (
        <>
          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {!isPlaying && (
              <>
                {NAV_ITEMS.map(({ target, label, icon: Icon }) => {
                  const active = currentScreen === target;
                  return (
                    <button
                      key={target}
                      onClick={() => go(target)}
                      className={cn(
                        "relative inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-caption transition-colors",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                      {active && (
                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                      )}
                    </button>
                  );
                })}
                <div className="mx-1 h-5 w-px bg-border" />
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-caption text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Çıkış
                </button>
              </>
            )}
          </nav>

          {/* Mobile sheet trigger */}
          {!isPlaying && (
            <div className="sm:hidden">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Menü">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-background border-border w-72">
                  <SheetTitle className="font-serif text-h2 mb-6">Menü</SheetTitle>
                  <div className="flex flex-col gap-1">
                    {NAV_ITEMS.map(({ target, label, icon: Icon }) => {
                      const active = currentScreen === target;
                      return (
                        <button
                          key={target}
                          onClick={() => go(target)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-lg text-body text-left transition-colors",
                            active
                              ? "bg-surface-sunken text-foreground"
                              : "text-foreground hover:bg-surface-sunken/60"
                          )}
                        >
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          {label}
                        </button>
                      );
                    })}
                    <div className="my-2 h-px bg-border" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-body text-left text-muted-foreground hover:text-foreground hover:bg-surface-sunken/60 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </>
      ) : !isPlaying ? (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => openModal("login")}>
            Giriş Yap
          </Button>
          <Button size="sm" onClick={() => openModal("register")}>
            Kayıt Ol
          </Button>
        </div>
      ) : null}
    </header>
  );
}
