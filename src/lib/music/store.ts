import { useEffect, useState } from "react";

export type Song = {
  id: string;
  title: string;
  artist: string;
  key: string;
  capo?: string;
  body: string;
  createdAt: number;
};

const KEY = "cifravocal.songs.v1";

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSongs(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(songs));
  }, [songs, ready]);

  const add = (s: Omit<Song, "id" | "createdAt">) =>
    setSongs((all) => [...all, { ...s, id: crypto.randomUUID(), createdAt: Date.now() }]);
  const remove = (id: string) => setSongs((all) => all.filter((s) => s.id !== id));
  const update = (id: string, patch: Partial<Song>) =>
    setSongs((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return { songs, add, remove, update, ready };
}
