import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useGameState } from "@/hooks/useGameState";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import WelcomeScreen from "@/components/WelcomeScreen";
import GameScreen from "@/components/GameScreen";
import FeedbackScreen from "@/components/FeedbackScreen";
import ResultScreen from "@/components/ResultScreen";
import { GameStateProvider } from "@/hooks/useGameState";

function Router() {
  return (
    <GameStateProvider>
      <CurrentScreen />
    </GameStateProvider>
  );
}

function CurrentScreen() {
  const { state } = useGameState();
  
  switch (state.currentScreen) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'game':
      return <GameScreen />;
    case 'feedback':
      return <FeedbackScreen />;
    case 'result':
      return <ResultScreen />;
    default:
      return <NotFound />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
