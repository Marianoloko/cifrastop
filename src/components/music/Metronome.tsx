import { useEffect, useRef, useState } from "react";
import { Play, Square, Minus, Plus } from "lucide-react";

export function Metronome() {
  const [bpm, setBpm] = useState(100);
  const [beats, setBeats] = useState(4);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextTimeRef = useRef(0);
  const stepRef = useRef(0);
  const tapsRef = useRef<number[]>([]);

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    ctxRef.current?.close();
    ctxRef.current = null;
    setRunning(false);
    setStep(0);
    stepRef.current = 0;
  };

  const tick = (ctx: AudioContext, time: number, accent: boolean) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1500 : 900;
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.5, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);
  };

  const start = () => {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC();
    ctxRef.current = ctx;
    nextTimeRef.current = ctx.currentTime + 0.1;
    stepRef.current = 0;
    setRunning(true);
    const scheduler = () => {
      const secondsPerBeat = 60 / bpm;
      while (nextTimeRef.current < ctx.currentTime + 0.15) {
        const s = stepRef.current % beats;
        tick(ctx, nextTimeRef.current, s === 0);
        const cur = s;
        setTimeout(() => setStep(cur), Math.max(0, (nextTimeRef.current - ctx.currentTime) * 1000));
        nextTimeRef.current += secondsPerBeat;
        stepRef.current++;
      }
    };
    timerRef.current = window.setInterval(scheduler, 25);
  };

  useEffect(() => () => stop(), []);

  const tap = () => {
    const now = performance.now();
    tapsRef.current = [...tapsRef.current.filter((t) => now - t < 3000), now];
    if (tapsRef.current.length >= 2) {
      const diffs = [];
      for (let i = 1; i < tapsRef.current.length; i++) diffs.push(tapsRef.current[i] - tapsRef.current[i - 1]);
      const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      const newBpm = Math.round(60000 / avg);
      if (newBpm >= 30 && newBpm <= 300) setBpm(newBpm);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Metrônomo</h2>

      <div className="text-center">
        <div className="text-7xl font-bold text-tom tabular-nums">{bpm}</div>
        <div className="text-sm text-muted-foreground">BPM</div>
      </div>

      <div className="flex items-center justify-center gap-3 mt-4">
        <button onClick={() => setBpm((b) => Math.max(30, b - 5))} className="h-11 w-11 rounded-full bg-secondary hover:bg-accent flex items-center justify-center"><Minus size={18} /></button>
        <input type="range" min={30} max={240} value={bpm} onChange={(e) => setBpm(+e.target.value)} className="flex-1 accent-[color:var(--tom)]" />
        <button onClick={() => setBpm((b) => Math.min(240, b + 5))} className="h-11 w-11 rounded-full bg-secondary hover:bg-accent flex items-center justify-center"><Plus size={18} /></button>
      </div>

      <div className="flex items-center justify-between mt-5">
        <label className="text-sm text-muted-foreground">Compasso</label>
        <div className="flex gap-1">
          {[2, 3, 4, 6].map((b) => (
            <button key={b} onClick={() => setBeats(b)} className={`px-3 py-1.5 rounded-lg text-sm ${beats === b ? "bg-tom text-white" : "bg-secondary"}`}>{b}/4</button>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: beats }).map((_, i) => (
          <div key={i} className={`h-3 w-3 rounded-full transition ${running && step === i ? (i === 0 ? "bg-tom scale-125" : "bg-amber scale-125") : "bg-border"}`} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-5">
        <button
          onClick={running ? stop : start}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium ${running ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}
        >
          {running ? <Square size={16} /> : <Play size={16} />}
          {running ? "Parar" : "Iniciar"}
        </button>
        <button onClick={tap} className="rounded-xl bg-secondary hover:bg-accent px-4 py-3 font-medium">Tap Tempo</button>
      </div>
    </div>
  );
}
