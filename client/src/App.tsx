import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ModeSelectionScreen from "@/components/ModeSelectionScreen";
import WelcomeScreen from "@/components/WelcomeScreen";
import GameScreen from "@/components/GameScreen";
import FeedbackScreen from "@/components/FeedbackScreen";
import ResultScreen from "@/components/ResultScreen";
import { useGameState, GameStateProvider } from "@/hooks/useGameState";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthModalProvider } from "@/hooks/useAuthModal";
import Header from "@/components/Header";

function CurrentScreen() {
  const { state } = useGameState();

  switch (state.currentScreen) {
    case "mode":
      return <ModeSelectionScreen />;
    case "welcome":
      return <WelcomeScreen />;
    case "game":
      return <GameScreen />;
    case "feedback":
      return <FeedbackScreen />;
    case "result":
      return <ResultScreen />;
    default:
      return <NotFound />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="max-w-3xl mx-auto p-4 sm:p-6">
            <Toaster />
            <GameStateProvider>
              <AuthModalProvider>
                <Header />
                <CurrentScreen />
              </AuthModalProvider>
            </GameStateProvider>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
