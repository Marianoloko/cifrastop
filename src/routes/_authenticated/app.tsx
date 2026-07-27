import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ListMusic, Headphones, Music2, Timer, Mic, LogOut } from "lucide-react";
import { Repertoire } from "@/components/music/Repertoire";
import { AudioMonitor } from "@/components/music/AudioMonitor";
import { Tuner } from "@/components/music/Tuner";
import { Metronome } from "@/components/music/Metronome";
import { Recorder } from "@/components/music/Recorder";
import { ThemeToggle } from "@/components/music/ThemeToggle";
import { TrialBanner } from "@/components/music/TrialBanner";
import { Paywall } from "@/components/music/Paywall";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import { readLegacySongs, importLegacyToCloud } from "@/lib/music/store";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "CifraVocal Pro — Cifras, Afinador, Metrônomo e Retorno de Áudio" },
      { name: "description", content: "Repertório de cifras, transposição, afinador cromático, metrônomo, retorno de áudio ao vivo e gravador de ensaio." },
      { property: "og:title", content: "CifraVocal Pro" },
      { property: "og:description", content: "Cifras, afinador, metrônomo e retorno de áudio em um só app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeApp,
});

type Tab = "repertoire" | "monitor" | "tuner" | "metronome" | "recorder";

const TABS: { id: Tab; label: string; icon: typeof ListMusic }[] = [
  { id: "repertoire", label: "Repertório", icon: ListMusic },
  { id: "monitor", label: "Retorno", icon: Headphones },
  { id: "tuner", label: "Afinador", icon: Music2 },
  { id: "metronome", label: "Metrônomo", icon: Timer },
  { id: "recorder", label: "Gravador", icon: Mic },
];

function HomeApp() {
  const [tab, setTab] = useState<Tab>("repertoire");
  const [showImport, setShowImport] = useState(false);
  const access = useAccess();
  const navigate = useNavigate();

  useEffect(() => {
    const legacy = readLegacySongs();
    if (legacy.length > 0) setShowImport(true);
  }, []);

  const handleSubscribe = () => alert("Pagamento em configuração. Em breve você poderá assinar por PIX ou Cartão.");
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (access.status === "loading") {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">Carregando…</div>;
  }

  if (access.status === "expired") {
    return <Paywall />;
  }

  return (
    <div className="min-h-screen bg-background">
      {access.status === "trial" && (
        <TrialBanner remainingMs={access.remainingMs} onSubscribe={handleSubscribe} />
      )}

      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border" style={{ top: access.status === "trial" ? "2.25rem" : 0 }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-amber text-white font-bold flex items-center justify-center shadow-sm chord-mono" style={{ color: "white" }}>
            CV
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-tight">CifraVocal Pro</h1>
            <p className="text-xs text-muted-foreground">
              {access.status === "subscriber" ? "Assinante Pro" : "Kit completo do músico"}
            </p>
          </div>
          <ThemeToggle />
          <button onClick={handleSignOut} aria-label="Sair" className="h-9 w-9 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground">
            <LogOut size={16} />
          </button>
        </div>
        <nav className="max-w-3xl mx-auto px-2 pb-2 flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                  active ? "bg-tom text-white shadow-sm" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {showImport && <ImportLegacyCard onClose={() => setShowImport(false)} />}
        {tab === "repertoire" && <Repertoire />}
        {tab === "monitor" && <AudioMonitor />}
        {tab === "tuner" && <Tuner />}
        {tab === "metronome" && <Metronome />}
        {tab === "recorder" && <Recorder />}
      </main>

      <footer className="max-w-3xl mx-auto px-4 py-8 text-center text-xs text-muted-foreground">
        Feito para músicos · Sincronizado na nuvem
      </footer>
    </div>
  );
}

function ImportLegacyCard({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const n = await importLegacyToCloud();
      alert(`${n} música(s) importada(s) para a nuvem.`);
      window.location.reload();
    } catch (e) {
      alert("Erro ao importar: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
      onClose();
    }
  };
  return (
    <div className="mb-4 rounded-2xl bg-amber-soft border border-tom/20 p-4 flex items-center gap-3">
      <div className="flex-1 text-sm">
        <div className="font-semibold text-tom">Repertório antigo detectado</div>
        <div className="text-xs text-muted-foreground">Importar para sua conta na nuvem?</div>
      </div>
      <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-lg hover:bg-accent">Depois</button>
      <button onClick={run} disabled={busy} className="text-xs px-3 py-1.5 rounded-lg bg-tom text-white disabled:opacity-50">
        {busy ? "Importando..." : "Importar"}
      </button>
    </div>
  );
}
