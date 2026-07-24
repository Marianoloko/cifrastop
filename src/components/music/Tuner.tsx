import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { detectPitch, freqToNote } from "@/lib/music/pitch";

export function Tuner() {
  const [active, setActive] = useState(false);
  const [note, setNote] = useState<{ note: string; octave: number; cents: number; freq: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
    ctxRef.current = null;
    streamRef.current = null;
    setActive(false);
    setNote(null);
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      ctxRef.current = ctx;
      streamRef.current = stream;
      setActive(true);
      const loop = () => {
        analyser.getFloatTimeDomainData(buf);
        const f = detectPitch(buf, ctx.sampleRate);
        if (f) setNote({ ...freqToNote(f), freq: f });
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível acessar o microfone");
    }
  };

  useEffect(() => () => stop(), []);

  const cents = note?.cents ?? 0;
  const tuned = note && Math.abs(cents) < 5;

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Afinador Cromático</h2>

      <div className="relative h-40 rounded-xl bg-secondary/60 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-border" />
        <div className="absolute top-0 h-3 w-0.5 bg-emerald left-1/2 -translate-x-1/2" />

        <div
          className="absolute top-0 h-3 w-1 bg-tom transition-all duration-100"
          style={{ left: `${50 + Math.max(-50, Math.min(50, cents))}%`, transform: "translateX(-50%)" }}
        />

        <div className={`text-6xl font-bold chord-mono ${tuned ? "text-emerald" : ""}`}>
          {note ? note.note : "—"}
          {note && <span className="text-2xl text-muted-foreground align-top ml-1">{note.octave}</span>}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {note ? `${cents > 0 ? "+" : ""}${cents} cents · ${note.freq.toFixed(1)} Hz` : "Toque uma nota"}
        </div>
      </div>

      {error && <p className="text-sm text-destructive mt-3">{error}</p>}

      <button
        onClick={active ? stop : start}
        className={`mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium transition ${
          active ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {active ? <MicOff size={18} /> : <Mic size={18} />}
        {active ? "Parar" : "Ativar afinador"}
      </button>
    </div>
  );
}
