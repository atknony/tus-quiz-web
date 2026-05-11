import { useState } from 'react';
import { Clock, AlertTriangle, Zap, ChevronLeft, Shield, Trophy, Info } from 'lucide-react';
import { useGameState } from '@/hooks/useGameState';
import { Section, Difficulty } from '@/lib/types';
import { SurfaceCard } from '@/components/ui/surface-card';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { cn } from '@/lib/utils';

interface DifficultyMeta {
  key: Difficulty;
  label: string;
  perQuestion: string;
  penalty: string;
  audience: string;
  tone: 'success' | 'warning' | 'danger';
  toneText: string;
}

const DIFFICULTIES: DifficultyMeta[] = [
  {
    key: 'easy',
    label: 'Kolay',
    perQuestion: 'Soru başına 120 saniye',
    penalty: 'Hata başına +120s ceza',
    audience: 'Yeni başlayanlar için',
    tone: 'success',
    toneText: 'text-success',
  },
  {
    key: 'medium',
    label: 'Orta',
    perQuestion: 'Soru başına 60 saniye',
    penalty: 'Hata başına +60s ceza',
    audience: 'Orta seviye öğrenciler için',
    tone: 'warning',
    toneText: 'text-warning',
  },
  {
    key: 'expert',
    label: 'Uzman',
    perQuestion: 'Soru başına 30 saniye',
    penalty: 'Hata başına +30s ceza',
    audience: 'Sınava hazır öğrenciler için',
    tone: 'danger',
    toneText: 'text-danger',
  },
];

const RULES = [
  'Cevaplayabildiğiniz kadar soruyu yanıtlayın',
  '5 yanlış cevaptan sonra oyun biter',
  'Sorular süre dolmadan cevaplanmalıdır',
  'Doğru cevaplar için 5 sn, yanlış cevaplar için 15 sn geribildirim süresi',
  'Düşük puan daha iyidir',
];

export default function WelcomeScreen() {
  const { selectSection, startGame, returnToMenu, state } = useGameState();
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section);
    selectSection(section);
  };

  const handleStartGame = (difficulty: Difficulty) => {
    if (selectedSection) startGame(difficulty);
  };

  const isPractice = state.mode === 'practice';

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          onClick={returnToMenu}
          className="inline-flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Mod Seçimi
        </button>
        <SemanticBadge tone={isPractice ? 'success' : 'neutral'} icon={isPractice ? <Shield /> : <Trophy />}>
          {isPractice ? 'Pratik Mod' : 'Rekabet Modu'}
        </SemanticBadge>
      </div>

      {/* Title */}
      <header className="text-center pt-2 pb-2">
        <div className="text-eyebrow text-muted-foreground mb-2">Hazırlık</div>
        <h1 className="font-serif text-h1 text-foreground">TUS Quiz</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Tıpta Uzmanlık Sınavı için bilgilerinizi test edin
        </p>
      </header>

      {/* Practice notice */}
      {isPractice && (
        <SurfaceCard variant="inset" tone="warning" padding="sm">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <p className="text-caption text-foreground/90">
              Pratik modu — bu oturumda hiçbir veri kaydedilmez.
            </p>
          </div>
        </SurfaceCard>
      )}

      {/* Section selection */}
      <section className="space-y-3">
        <div>
          <h2 className="font-serif text-h2 text-foreground">Bölüm Seçin</h2>
          <p className="text-caption text-muted-foreground mt-0.5">Çalışmak istediğiniz tıp alanı</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['klinik', 'preklinik'] as Section[]).map((sec) => {
            const active = selectedSection === sec;
            return (
              <button
                key={sec}
                onClick={() => handleSectionSelect(sec)}
                className={cn(
                  "text-left rounded-2xl border transition-all p-5",
                  active
                    ? "bg-surface-sunken border-foreground/40 border-2"
                    : "bg-surface border-border hover:border-border-strong"
                )}
              >
                <div className="font-serif text-h2 text-foreground mb-1">
                  {sec === 'klinik' ? 'Klinik' : 'Preklinik'}
                </div>
                <div className="text-caption text-muted-foreground">
                  {sec === 'klinik' ? 'Klinik tıp alanı soruları' : 'Temel tıp bilimleri soruları'}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Difficulty selection */}
      {selectedSection && (
        <section className="space-y-3 animate-fade-in-up">
          <div>
            <h2 className="font-serif text-h2 text-foreground">Zorluk Seviyesi</h2>
            <p className="text-caption text-muted-foreground mt-0.5">
              Zorluk yalnızca cevaplama süresini belirler
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => (
              <SurfaceCard
                key={d.key}
                variant="interactive"
                tone={d.tone}
                padding="md"
                onClick={() => handleStartGame(d.key)}
              >
                <div className={cn("font-serif text-h2 mb-3", d.toneText)}>{d.label}</div>
                <ul className="space-y-2 text-caption text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-soft" />
                    <span>{d.perQuestion}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-soft" />
                    <span>{d.penalty}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-soft" />
                    <span>{d.audience}</span>
                  </li>
                </ul>
              </SurfaceCard>
            ))}
          </div>
        </section>
      )}

      {/* Rules */}
      <SurfaceCard variant="inset" padding="md">
        <div className="text-eyebrow text-muted-foreground mb-3">Oyun Kuralları</div>
        <ul className="space-y-2">
          {RULES.map((rule, i) => (
            <li key={i} className="flex items-start gap-3 text-body text-foreground/90">
              <span className="text-muted-soft font-serif tabular-nums shrink-0 w-4">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </SurfaceCard>
    </div>
  );
}
