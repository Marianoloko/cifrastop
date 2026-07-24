// Music theory helpers: note parsing, transposition, chord diagrams.

export const NOTES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#",
};

export function normalizeRoot(note: string): string {
  const n = note.replace(/^([A-G])([b#]?)/, (_, l, acc) => l.toUpperCase() + acc);
  return FLAT_TO_SHARP[n] ?? n;
}

// Parse "Am7", "F#maj7", "C/G" -> { root, quality, bass }
export function parseChord(sym: string): { root: string; quality: string; bass?: string } | null {
  const m = sym.match(/^([A-G][b#]?)([^/\s]*)(?:\/([A-G][b#]?))?$/);
  if (!m) return null;
  return {
    root: normalizeRoot(m[1]),
    quality: m[2] ?? "",
    bass: m[3] ? normalizeRoot(m[3]) : undefined,
  };
}

export function transposeNote(note: string, semitones: number): string {
  const idx = NOTES_SHARP.indexOf(normalizeRoot(note));
  if (idx < 0) return note;
  const next = (idx + semitones + 1200) % 12;
  return NOTES_SHARP[next];
}

export function transposeChord(sym: string, semitones: number): string {
  const p = parseChord(sym);
  if (!p) return sym;
  const root = transposeNote(p.root, semitones);
  const bass = p.bass ? transposeNote(p.bass, semitones) : undefined;
  return root + p.quality + (bass ? "/" + bass : "");
}

// Transpose an entire cifra text: replaces chord tokens on chord-only lines
// and inside [chord] markers. Heuristic: a line is a chord line if >70% of
// its non-whitespace tokens are valid chords.
const CHORD_TOKEN = /\b([A-G][b#]?(?:m|maj|min|dim|aug|sus|add)?[0-9]*(?:\/[A-G][b#]?)?)\b/g;

function looksLikeChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  let hits = 0;
  for (const t of tokens) if (parseChord(t)) hits++;
  return hits / tokens.length >= 0.7;
}

export function transposeCifra(text: string, semitones: number): string {
  if (semitones === 0) return text;
  return text
    .split("\n")
    .map((line) => {
      // [Am] bracket style
      if (line.includes("[")) {
        return line.replace(/\[([^\]]+)\]/g, (_, c) => `[${transposeChord(c, semitones)}]`);
      }
      if (looksLikeChordLine(line)) {
        return line.replace(CHORD_TOKEN, (m) => transposeChord(m, semitones));
      }
      return line;
    })
    .join("\n");
}

// Simple guitar chord diagrams: strings E A D G B e (low to high),
// numbers = fret, -1 = muted, 0 = open. Base set covers commons; unknown
// chords fall back to a text badge.
export type ChordShape = { frets: number[]; fingers?: number[]; baseFret?: number };

export const CHORD_SHAPES: Record<string, ChordShape> = {
  C: { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  "C7": { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  Cm: { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1] },
  D: { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  D7: { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  Dm: { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  E: { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  E7: { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  Em: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  F: { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1] },
  Fm: { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1] },
  G: { frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4] },
  G7: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  A: { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  A7: { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  Am: { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  B7: { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  Bm: { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1] },
  "C#m": { frets: [-1, 4, 6, 6, 5, 4], baseFret: 4 },
  "D#m": { frets: [-1, 6, 8, 8, 7, 6], baseFret: 6 },
  "F#": { frets: [2, 4, 4, 3, 2, 2], baseFret: 2 },
  "F#m": { frets: [2, 4, 4, 2, 2, 2], baseFret: 2 },
  "G#m": { frets: [4, 6, 6, 4, 4, 4], baseFret: 4 },
  "A#": { frets: [-1, 1, 3, 3, 3, 1] },
  "A#m": { frets: [-1, 1, 3, 3, 2, 1] },
};

export function getChordShape(sym: string): ChordShape | null {
  const p = parseChord(sym);
  if (!p) return null;
  const key = p.root + p.quality.replace(/^maj$/, "");
  return CHORD_SHAPES[key] ?? CHORD_SHAPES[p.root] ?? null;
}
