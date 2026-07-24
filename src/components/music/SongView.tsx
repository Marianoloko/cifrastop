import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Minus, Plus, Play, Pause, Maximize2, Music } from "lucide-react";
import { transposeCifra, transposeChord, parseChord } from "@/lib/music/chords";
import { ChordDiagram } from "./ChordDiagram";
import type { Song } from "@/lib/music/store";

const CHORD_TOKEN = /\b([A-G][b#]?(?:m|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][b#]?)?)\b/g;

function isChordLine(line: string) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  let hits = 0;
  for (const t of tokens) if (parseChord(t)) hits++;
  return hits / tokens.length >= 0.7;
}

export function SongView({ song, onBack }: { song: Song; onBack: () => void }) {
  const [semitones, setSemitones] = useState(0);
  const [autoscroll, setAutoscroll] = useState(false);
  const [speed, setSpeed] = useState(30);
  const [stage, setStage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const transposedKey = useMemo(() => transposeChord(song.key, semitones), [song.key, semitones]);
  const transposedBody = useMemo(() => transposeCifra(song.body, semitones), [song.body, semitones]);

  const uniqueChords = useMemo(() => {
    const set = new Set<string>();
    for (const line of transposedBody.split("\n")) {
      if (!isChordLine(line) && !line.includes("[")) continue;
      const src = line.includes("[") ? line.match(/\[[^\]]+\]/g)?.map((s) => s.slice(1, -1)).join(" ") ?? "" : line;
      for (const m of src.matchAll(CHORD_TOKEN)) if (parseChord(m[1])) set.add(m[1]);
    }
    return Array.from(set).slice(0, 24);
  }, [transposedBody]);

  useEffect(() => {
    if (!autoscroll) return;
    let last = performance.now();
    const step = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      if (scrollRef.current) scrollRef.current.scrollTop += (speed * dt);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [autoscroll, speed]);

  const renderLine = (line: string, i: number) => {
    if (line.includes("[")) {
      const parts = line.split(/(\[[^\]]+\])/);
      return (
        <div key={i} className="whitespace-pre">
          {parts.map((p, j) =>
            p.startsWith("[") ? <span key={j} className="chord-mono">{p.slice(1, -1)}</span> : <span key={j}>{p}</span>
          )}
        </div>
      );
    }
    if (isChordLine(line)) {
      return <div key={i} className="whitespace-pre chord-mono">{line}</div>;
    }
    return <div key={i} className="whitespace-pre">{line || "\u00A0"}</div>;
  };

  return (
    <div className={stage ? "fixed inset-0 z-50 bg-background flex flex-col" : ""}>
      <div className="flex items-center gap-2 p-4 border-b border-border bg-card">
        <button onClick={stage ? () => setStage(false) : onBack} className="h-9 w-9 rounded-lg hover:bg-accent flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{song.title}</div>
          <div className="text-xs text-muted-foreground truncate">{song.artist}</div>
        </div>
        <button onClick={() => setStage((s) => !s)} className="h-9 w-9 rounded-lg hover:bg-accent flex items-center justify-center" title="Modo palco">
          <Maximize2 size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/40 flex-wrap">
        <div className="flex items-center gap-1 rounded-lg bg-card border border-border p-1">
          <button onClick={() => setSemitones((s) => s - 1)} className="h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center"><Minus size={14} /></button>
          <div className="px-2 text-sm">
            Tom: <span className="chord-mono">{transposedKey}</span>
            {semitones !== 0 && <span className="text-xs text-muted-foreground ml-1">({semitones > 0 ? "+" : ""}{semitones})</span>}
          </div>
          <button onClick={() => setSemitones((s) => s + 1)} className="h-8 w-8 rounded-md hover:bg-accent flex items-center justify-center"><Plus size={14} /></button>
        </div>

        <button
          onClick={() => setAutoscroll((a) => !a)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${autoscroll ? "bg-tom text-white" : "bg-card border border-border"}`}
        >
          {autoscroll ? <Pause size={14} /> : <Play size={14} />}
          Autoscroll
        </button>

        <input type="range" min={5} max={120} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="flex-1 min-w-[100px] accent-[color:var(--tom)]" />
      </div>

      {uniqueChords.length > 0 && (
        <div className="px-4 py-3 border-b border-border overflow-x-auto">
          <div className="flex gap-3 min-w-max">
            {uniqueChords.map((c) => <ChordDiagram key={c} chord={c} />)}
          </div>
        </div>
      )}

      <div ref={scrollRef} className={`overflow-y-auto ${stage ? "flex-1" : "max-h-[60vh]"}`}>
        <pre className={`p-4 leading-relaxed ${stage ? "text-xl" : "text-sm"} font-sans`}>
          {transposedBody.split("\n").map(renderLine)}
        </pre>
      </div>
    </div>
  );
}
