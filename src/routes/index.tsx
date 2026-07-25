import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CifraVocal Pro — Cifras, Afinador, Metrônomo e Retorno de Áudio" },
      { name: "description", content: "Ferramenta completa para músicos: repertório de cifras com transposição, afinador cromático, metrônomo, retorno de áudio e gravador." },
      { property: "og:title", content: "CifraVocal Pro" },
      { property: "og:description", content: "Cifras, afinador, metrônomo e retorno de áudio em um só app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
  ssr: false,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app", replace: true });
      else navigate({ to: "/auth", replace: true });
    });
  }, [navigate]);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
      Carregando…
    </div>
  );
}
