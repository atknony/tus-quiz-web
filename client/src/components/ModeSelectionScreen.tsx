import { Shield, Trophy, AlertCircle } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/hooks/useAuthModal';
import { SurfaceCard } from '@/components/ui/surface-card';

export default function ModeSelectionScreen() {
  const { selectMode } = useGameState();
  const { user } = useAuth();
  const { open: openModal } = useAuthModal();

  const handleCompetitive = () => {
    if (user) {
      selectMode('competitive');
    } else {
      openModal('login');
    }
  };

  return (
    <div className="animate-fade-in-up py-6 sm:py-10">
      <header className="text-center mb-10 sm:mb-14">
        <div className="text-eyebrow text-muted-foreground mb-3">Başla</div>
        <h1 className="font-serif text-display text-foreground">TUS Quiz</h1>
        <p className="mt-3 text-body-lg text-muted-foreground">Bir mod seçin</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl lg:max-w-2xl mx-auto">
        <SurfaceCard
          variant="interactive"
          tone="success"
          padding="lg"
          onClick={() => selectMode('practice')}
        >
          <Shield className="w-5 h-5 text-success mb-4" />
          <h2 className="font-serif text-h2 text-foreground mb-2">Pratik Mod</h2>
          <p className="text-caption text-muted-foreground leading-relaxed">
            Giriş gerektirmez. Hiçbir veri kaydedilmez.
          </p>
        </SurfaceCard>

        <SurfaceCard
          variant="interactive"
          tone="accent"
          padding="lg"
          onClick={handleCompetitive}
        >
          <Trophy className="w-5 h-5 text-foreground mb-4" />
          <h2 className="font-serif text-h2 text-foreground mb-2">Rekabet Modu</h2>
          <p className="text-caption text-muted-foreground leading-relaxed">
            Skor ve istatistikler kaydedilir.
          </p>
          {!user && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-caption text-warning">
              <AlertCircle className="w-3.5 h-3.5" />
              Giriş yapmanız gerekir
            </div>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
