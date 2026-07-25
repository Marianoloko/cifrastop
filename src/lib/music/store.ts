import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Song = {
  id: string;
  title: string;
  artist: string;
  key: string;
  capo?: string;
  body: string;
  createdAt: number;
};

const LEGACY_KEY = "cifravocal.songs.v1";

type Row = {
  id: string;
  title: string;
  artist: string;
  key: string;
  capo: string;
  body: string;
  created_at: string;
};

function rowToSong(r: Row): Song {
  return {
    id: r.id,
    title: r.title,
    artist: r.artist,
    key: r.key,
    capo: r.capo,
    body: r.body,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export function useSongs() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["songs"],
    queryFn: async (): Promise<Song[]> => {
      const { data, error } = await supabase
        .from("songs")
        .select("id,title,artist,key,capo,body,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Row[]).map(rowToSong);
    },
  });

  const addMutation = useMutation({
    mutationFn: async (s: Omit<Song, "id" | "createdAt">) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Não autenticado");
      const { error } = await supabase.from("songs").insert({
        user_id: uid,
        title: s.title,
        artist: s.artist,
        key: s.key,
        capo: s.capo ?? "Sem Capo",
        body: s.body,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["songs"] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("songs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["songs"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Song> }) => {
      const dbPatch: {
        title?: string; artist?: string; key?: string; capo?: string; body?: string;
      } = {};
      if (patch.title !== undefined) dbPatch.title = patch.title;
      if (patch.artist !== undefined) dbPatch.artist = patch.artist;
      if (patch.key !== undefined) dbPatch.key = patch.key;
      if (patch.capo !== undefined) dbPatch.capo = patch.capo;
      if (patch.body !== undefined) dbPatch.body = patch.body;
      const { error } = await supabase.from("songs").update(dbPatch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["songs"] }),
  });

  return {
    songs: query.data ?? [],
    ready: !query.isLoading,
    add: (s: Omit<Song, "id" | "createdAt">) => addMutation.mutate(s),
    remove: (id: string) => removeMutation.mutate(id),
    update: (id: string, patch: Partial<Song>) => updateMutation.mutate({ id, patch }),
  };
}

export function readLegacySongs(): Omit<Song, "id" | "createdAt">[] {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Song[];
    return parsed.map((s) => ({
      title: s.title,
      artist: s.artist ?? "",
      key: s.key ?? "C",
      capo: s.capo ?? "Sem Capo",
      body: s.body ?? "",
    }));
  } catch {
    return [];
  }
}

export function clearLegacySongs() {
  try { localStorage.removeItem(LEGACY_KEY); } catch {}
}

export async function importLegacyToCloud() {
  const legacy = readLegacySongs();
  if (!legacy.length) return 0;
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error("Não autenticado");
  const rows = legacy.map((s) => ({
    user_id: uid,
    title: s.title,
    artist: s.artist,
    key: s.key,
    capo: s.capo ?? "Sem Capo",
    body: s.body,
  }));
  const { error } = await supabase.from("songs").insert(rows);
  if (error) throw error;
  clearLegacySongs();
  return rows.length;
}
