import { CreditCard, QrCode, Lock, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export function Paywall() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    // Stripe checkout será conectado quando o plano Pro estiver ativo
    alert("Pagamento em configuração. Em breve você poderá assinar por PIX ou Cartão.");
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="rounded-2xl bg-card border border-border shadow-lg p-6 sm:p-8">
          <div className="h-14 w-14 rounded-2xl bg-amber-soft text-tom flex items-center justify-center mx-auto mb-4">
            <Lock size={26} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-center">Seu teste grátis acabou</h1>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Continue com todos os recursos do CifraVocal Pro por apenas
          </p>
          <div className="text-center my-5">
            <div className="text-4xl font-bold chord-mono">R$ 15</div>
            <div className="text-xs text-muted-foreground">/ mês · cancele quando quiser</div>
          </div>

          <ul className="space-y-2 text-sm mb-5">
            <Feature>Repertório sincronizado na nuvem</Feature>
            <Feature>Transposição de tom em tempo real</Feature>
            <Feature>Modo Palco com autoscroll</Feature>
            <Feature>Retorno de áudio, afinador, metrônomo e gravador</Feature>
          </ul>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full rounded-xl bg-tom text-white font-semibold py-3 hover:opacity-95 disabled:opacity-50 transition"
          >
            {loading ? "Aguarde..." : "Assinar agora"}
          </button>

          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><QrCode size={14} /> PIX</span>
            <span className="inline-flex items-center gap-1"><CreditCard size={14} /> Cartão</span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1"
        >
          <LogOut size={12} /> Sair da conta
        </button>
      </div>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-tom mt-0.5">✓</span>
      <span>{children}</span>
    </li>
  );
}
