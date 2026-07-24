import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ListMusic, Headphones, Music2, Timer, Mic } from "lucide-react";
import { Repertoire } from "@/components/music/Repertoire";
import { AudioMonitor } from "@/components/music/AudioMonitor";
import { Tuner } from "@/components/music/Tuner";
import { Metronome } from "@/components/music/Metronome";
import { Recorder } from "@/components/music/Recorder";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CifraVocal Pro — Cifras, Afinador, Metrônomo e Retorno de Áudio" },
      { name: "description", content: "Ferramenta completa para músicos: repertório de cifras com transposição, afinador cromático, metrônomo, retorno de áudio ao vivo e gravador de ensaio." },
      { property: "og:title", content: "CifraVocal Pro" },
      { property: "og:description", content: "Cifras, afinador, metrônomo e retorno de áudio em um só app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type Tab = "repertoire" | "monitor" | "tuner" | "metronome" | "recorder";

const TABS: { id: Tab; label: string; icon: typeof ListMusic }[] = [
  { id: "repertoire", label: "Repertório", icon: ListMusic },
  { id: "monitor", label: "Retorno", icon: Headphones },
  { id: "tuner", label: "Afinador", icon: Music2 },
  { id: "metronome", label: "Metrônomo", icon: Timer },
  { id: "recorder", label: "Gravador", icon: Mic },
];

function Home() {
  const [tab, setTab] = useState<Tab>("repertoire");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-amber text-white font-bold flex items-center justify-center shadow-sm chord-mono" style={{ color: "white" }}>
            CV
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-tight">CifraVocal Pro</h1>
            <p className="text-xs text-muted-foreground">Kit completo do músico</p>
          </div>
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
        {tab === "repertoire" && <Repertoire />}
        {tab === "monitor" && <AudioMonitor />}
        {tab === "tuner" && <Tuner />}
        {tab === "metronome" && <Metronome />}
        {tab === "recorder" && <Recorder />}
      </main>

      <footer className="max-w-3xl mx-auto px-4 py-8 text-center text-xs text-muted-foreground">
        Feito para músicos · Funciona 100% no seu navegador
      </footer>
    </div>
  );
}
