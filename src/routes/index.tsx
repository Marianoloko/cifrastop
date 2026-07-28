import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Paywall } from "@/components/music/Paywall";
import { ThemeToggle } from "@/components/music/ThemeToggle";
import { ListMusic, Headphones, Music2, Timer, Mic, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CifraStop — Cifras, Afinador, Metrônomo e Retorno de Áudio" },
      {
        name: "description",
        content:
          "Kit completo do músico: repertório de cifras com transposição e auto-scroll, afinador cromático, metrônomo, retorno de áudio ao vivo e gravador de ensaio.",
      },
      { property: "og:title", content: "CifraStop — o kit completo do músico" },
      {
        property: "og:description",
        content: "Cifras com transposição, afinador, metrônomo, retorno de áudio e gravador em um só app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: ListMusic, title: "Repertório de cifras", text: "Transposição de tom, auto-scroll e modo palco." },
  { icon: Headphones, title: "Retorno de áudio", text: "Ouça sua voz ao vivo com reverb e delay." },
  { icon: Music2, title: "Afinador cromático", text: "Afinação precisa direto pelo microfone." },
  { icon: Timer, title: "Metrônomo", text: "BPM com tap tempo e compassos variados." },
  { icon: Mic, title: "Gravador de ensaio", text: "Grave, ouça e baixe seus ensaios." },
];

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active && data.session) navigate({ to: "/app", replace: true });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber font-bold flex items-center justify-center chord-mono" style={{ color: "white" }}>
            CV
          </div>
          <span className="font-bold text-lg flex-1">CifraStop</span>
          <ThemeToggle />
          <Link to="/auth">
            <Button size="sm">Entrar</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="max-w-3xl mx-auto px-4 pt-16 pb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            O kit completo do músico, num app só
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Cifras com transposição e rolagem automática, afinador, metrônomo, retorno de áudio ao vivo e gravador de
            ensaio. Teste grátis por 2 horas.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto text-base py-6 px-8">
                Criar conta e testar grátis por 2 horas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl border border-border p-5 bg-card">
                <Icon className="w-6 h-6 text-primary mb-3" />
                <h2 className="font-semibold text-foreground">{f.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{f.text}</p>
              </div>
            );
          })}
        </section>

        <Paywall />
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-10 text-center text-xs text-muted-foreground">
        CifraStop · Feito para músicos
      </footer>
    </div>
  );
}
