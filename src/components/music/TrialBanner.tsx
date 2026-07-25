import { Clock } from "lucide-react";
import { formatRemaining } from "@/hooks/useAccess";

export function TrialBanner({ remainingMs, onSubscribe }: { remainingMs: number; onSubscribe: () => void }) {
  return (
    <div className="sticky top-0 z-40 bg-tom text-white shadow-md">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-3 text-sm">
        <Clock size={16} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-medium">Teste grátis</span>
          <span className="mx-2 opacity-70">•</span>
          <span className="chord-mono text-white">{formatRemaining(remainingMs)}</span>
          <span className="ml-1 opacity-80 hidden sm:inline">restantes</span>
        </div>
        <button
          onClick={onSubscribe}
          className="shrink-0 rounded-full bg-white/95 text-tom text-xs font-semibold px-3 py-1 hover:bg-white transition"
        >
          Assinar R$ 15/mês
        </button>
      </div>
    </div>
  );
}
