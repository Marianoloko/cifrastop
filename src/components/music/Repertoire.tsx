import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Music } from "lucide-react";
import { useSongs, type Song } from "@/lib/music/store";
import { SongView } from "./SongView";

export function Repertoire() {
  const { songs, add, remove } = useSongs();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Song | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.key.toLowerCase().includes(q));
  }, [songs, query]);

  if (selected) return <SongView song={songs.find((s) => s.id === selected.id) ?? selected} onBack={() => setSelected(null)} />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2.5">
            <Search size={16} className="text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar por título, artista ou tom..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <button onClick={() => setShowAdd(true)} className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <Plus size={18} />
          </button>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Repertório Principal · <span className="chord-mono">{songs.length}</span> {songs.length === 1 ? "Música" : "Músicas"}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-10 text-center">
          <Music className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="text-sm text-muted-foreground">Nenhuma música ainda. Toque em <span className="chord-mono">+</span> para adicionar.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((s, i) => (
            <li key={s.id} className="group">
              <button
                onClick={() => setSelected(s)}
                className="w-full text-left rounded-xl bg-card border border-border hover:border-tom/40 hover:shadow-sm transition p-3 flex items-center gap-3"
              >
                <div className="h-9 w-9 rounded-lg bg-amber-soft text-tom font-bold flex items-center justify-center chord-mono text-sm shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{s.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {s.artist} · <span className="chord-mono text-tom">Tom: {s.key}</span>
                  </div>
                </div>
                <div className="text-xs chord-mono text-muted-foreground shrink-0 hidden sm:block">{s.capo || "Sem Capo"}</div>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm(`Remover "${s.title}"?`)) remove(s.id); }}
                  className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 size={14} />
                </button>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showAdd && <AddSongDialog onClose={() => setShowAdd(false)} onAdd={(s) => { add(s); setShowAdd(false); }} />}
    </div>
  );
}

function AddSongDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Omit<Song, "id" | "createdAt">) => void }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [key, setKey] = useState("C");
  const [capo, setCapo] = useState("Sem Capo");
  const [body, setBody] = useState("");

  return (
    <div className="fixed inset-0 z-40 bg-foreground/40 flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold">Nova música</h3>
          <p className="text-xs text-muted-foreground">Cole a cifra no campo abaixo. Acordes entre <code className="chord-mono">[colchetes]</code> ou em linhas separadas.</p>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Título"><input value={title} onChange={(e) => setTitle(e.target.value)} className="input" /></Field>
          <Field label="Artista"><input value={artist} onChange={(e) => setArtist(e.target.value)} className="input" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tom"><input value={key} onChange={(e) => setKey(e.target.value)} className="input chord-mono" /></Field>
            <Field label="Capo"><input value={capo} onChange={(e) => setCapo(e.target.value)} className="input" /></Field>
          </div>
          <Field label="Cifra">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="input font-mono text-xs"
              placeholder={`[C]Twinkle twinkle [F]little [C]star\nHow I [F]wonder [C]what you [G]are`}
            />
          </Field>
        </div>
        <div className="p-4 border-t border-border flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-accent text-sm">Cancelar</button>
          <button
            onClick={() => title && onAdd({ title, artist, key, capo, body })}
            disabled={!title}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </div>
      <style>{`.input{width:100%;background:var(--secondary);border:1px solid var(--border);border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none}.input:focus{border-color:var(--tom)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground block mb-1">{label}</span>
      {children}
    </label>
  );
}
