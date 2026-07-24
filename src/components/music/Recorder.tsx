import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Download } from "lucide-react";

type Take = { id: string; url: string; blob: Blob; duration: number; createdAt: number };

export function Recorder() {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [takes, setTakes] = useState<Take[]>([]);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const timerRef = useRef<number | null>(null);

  const stop = () => {
    recRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type ?? "audio/webm" });
        const url = URL.createObjectURL(blob);
        const duration = (performance.now() - startedAt.current) / 1000;
        setTakes((t) => [{ id: crypto.randomUUID(), url, blob, duration, createdAt: Date.now() }, ...t]);
      };
      recRef.current = mr;
      streamRef.current = stream;
      startedAt.current = performance.now();
      setElapsed(0);
      mr.start();
      setRecording(true);
      timerRef.current = window.setInterval(() => setElapsed((performance.now() - startedAt.current) / 1000), 100);
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível gravar");
    }
  };

  useEffect(() => () => { stop(); takes.forEach((t) => URL.revokeObjectURL(t.url)); }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Gravador de Ensaio</h2>

      <div className="flex flex-col items-center">
        <div className="text-5xl font-bold chord-mono tabular-nums">{fmt(elapsed)}</div>
        <button
          onClick={recording ? stop : start}
          className={`mt-4 h-20 w-20 rounded-full flex items-center justify-center transition ${
            recording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-tom text-white hover:brightness-110"
          }`}
        >
          {recording ? <Square size={28} /> : <Mic size={28} />}
        </button>
        <p className="text-xs text-muted-foreground mt-2">{recording ? "Gravando..." : "Toque para gravar"}</p>
      </div>

      {error && <p className="text-sm text-destructive mt-3">{error}</p>}

      <div className="mt-6 space-y-2">
        {takes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma gravação ainda</p>}
        {takes.map((t, i) => (
          <div key={t.id} className="rounded-xl bg-secondary/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Take {takes.length - i} · {fmt(t.duration)}</div>
              <div className="flex gap-1">
                <a href={t.url} download={`ensaio-${t.id.slice(0, 6)}.webm`} className="h-8 w-8 rounded-lg bg-card hover:bg-accent flex items-center justify-center"><Download size={14} /></a>
                <button onClick={() => { URL.revokeObjectURL(t.url); setTakes((all) => all.filter((x) => x.id !== t.id)); }} className="h-8 w-8 rounded-lg bg-card hover:bg-accent flex items-center justify-center text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
            <audio src={t.url} controls className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
