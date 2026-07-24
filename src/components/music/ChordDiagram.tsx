import { getChordShape } from "@/lib/music/chords";

export function ChordDiagram({ chord, size = 56 }: { chord: string; size?: number }) {
  const shape = getChordShape(chord);
  if (!shape) {
    return (
      <div className="inline-flex items-center justify-center rounded-md border border-border bg-card px-2 py-1 text-xs chord-mono">
        {chord}
      </div>
    );
  }
  const w = size, h = size * 1.25;
  const padX = 8, padTop = 14, padBot = 6;
  const stringCount = 6;
  const fretCount = 4;
  const gridW = w - padX * 2;
  const gridH = h - padTop - padBot;
  const sx = gridW / (stringCount - 1);
  const sy = gridH / fretCount;
  const baseFret = shape.baseFret ?? 1;

  return (
    <div className="flex flex-col items-center">
      <div className="text-[11px] chord-mono mb-0.5">{chord}</div>
      <svg width={w} height={h} className="text-foreground/80">
        {/* nut */}
        {baseFret === 1 && (
          <rect x={padX} y={padTop - 3} width={gridW} height={3} fill="currentColor" />
        )}
        {baseFret > 1 && (
          <text x={padX - 4} y={padTop + sy * 0.7} fontSize="8" textAnchor="end" fill="currentColor">
            {baseFret}fr
          </text>
        )}
        {/* frets */}
        {Array.from({ length: fretCount + 1 }).map((_, i) => (
          <line key={i} x1={padX} y1={padTop + i * sy} x2={padX + gridW} y2={padTop + i * sy} stroke="currentColor" strokeWidth={0.8} opacity={0.6} />
        ))}
        {/* strings */}
        {Array.from({ length: stringCount }).map((_, i) => (
          <line key={i} x1={padX + i * sx} y1={padTop} x2={padX + i * sx} y2={padTop + gridH} stroke="currentColor" strokeWidth={0.8} opacity={0.6} />
        ))}
        {/* markers */}
        {shape.frets.map((f, i) => {
          const cx = padX + i * sx;
          if (f === -1) {
            return <text key={i} x={cx} y={padTop - 5} fontSize="9" textAnchor="middle" fill="currentColor">×</text>;
          }
          if (f === 0) {
            return <circle key={i} cx={cx} cy={padTop - 5} r={2.5} fill="none" stroke="currentColor" strokeWidth={0.8} />;
          }
          const rel = f - baseFret + 1;
          const cy = padTop + rel * sy - sy / 2;
          return <circle key={i} cx={cx} cy={cy} r={sx * 0.32} fill="var(--tom)" />;
        })}
      </svg>
    </div>
  );
}
