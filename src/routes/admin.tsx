import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Search, UserCheck, Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchPlans, type Plan } from "@/lib/plans";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel administrativo · CifraStop" },
      { name: "description", content: "Área restrita para gerenciar planos, assinaturas e acessos do CifraStop." },
      { property: "og:title", content: "Painel administrativo · CifraStop" },
      { property: "og:description", content: "Área restrita de gestão de planos e assinaturas do CifraStop." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

type Draft = Omit<Plan, "id"> & { id?: string; featuresText: string; rulesText: string };

function toDraft(plan: Plan): Draft {
  return {
    ...plan,
    featuresText: plan.features.join("\n"),
    rulesText: JSON.stringify(plan.rules ?? {}, null, 2),
  };
}

function emptyDraft(): Draft {
  return {
    name: "",
    description: "",
    price_label: "",
    period_label: "",
    duration_days: 30,
    badge: "",
    featured: false,
    whatsapp_message: "",
    features: [],
    rules: {},
    active: true,
    sort_order: 99,
    featuresText: "",
    rulesText: "{\n  \"limite_musicas\": \"ilimitado\"\n}",
  };
}

function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const check = async () => {
    setChecking(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }
    const { data } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    setIsAdmin(Boolean(data));
    setChecking(false);
  };

  useEffect(() => {
    void check();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ variant: "destructive", title: "Acesso negado", description: error.message });
      return;
    }
    await check();
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        Verificando permissões…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-2" />
            <CardTitle>Painel Administrativo</CardTitle>
            <CardDescription>Entre com sua conta de administrador</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">Entrar no Painel</Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Só contas com permissão de administrador conseguem acessar esta área.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminDashboard onSignOut={async () => { await supabase.auth.signOut(); await check(); }} />;
}

function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-background p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Painel CifraStop</h1>
        <Button variant="outline" onClick={onSignOut}>Sair</Button>
      </div>
      <ClientManager />
      <PlansManager />
    </div>
  );
}

function ClientManager() {
  const [search, setSearch] = useState("");
  const [foundUser, setFoundUser] = useState<{ id: string; phone: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { data: plans } = useQuery({ queryKey: ["plans", "admin"], queryFn: () => fetchPlans(true) });

  const handleSearch = async () => {
    setLoading(true);
    setFoundUser(null);
    const term = search.trim();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, phone, email")
      .or(`phone.eq.${term},email.eq.${term}`)
      .maybeSingle();
    setLoading(false);
    if (error || !data) {
      toast({ variant: "destructive", title: "Usuário não encontrado", description: "Confira o telefone ou e-mail informado." });
      return;
    }
    setFoundUser(data);
    toast({ title: "Usuário encontrado!", description: data.phone ?? data.email ?? "" });
  };

  const activate = async (days: number, planName: string) => {
    if (!foundUser) return;
    const end = new Date();
    end.setDate(end.getDate() + days);
    const { error } = await supabase
      .from("subscriptions")
      .upsert({ user_id: foundUser.id, status: "active", current_period_end: end.toISOString() }, { onConflict: "user_id" });
    if (error) {
      toast({ variant: "destructive", title: "Erro ao ativar plano", description: error.message });
      return;
    }
    toast({ title: "Plano ativado!", description: `${planName} liberado até ${end.toLocaleDateString()}.` });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liberar acesso de cliente</CardTitle>
        <CardDescription>Busque por telefone (WhatsApp) ou e-mail cadastrado</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Input placeholder="(98) 98715-0431 ou email@exemplo.com" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={handleSearch} disabled={loading || !search.trim()}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </div>

        {foundUser && (
          <div className="rounded-lg border border-primary p-4 space-y-3">
            <p className="flex items-center gap-2 font-medium">
              <UserCheck className="text-primary w-4 h-4" /> {foundUser.phone ?? foundUser.id}
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {(plans ?? []).map((p) => (
                <Button key={p.id} variant={p.featured ? "default" : "secondary"} onClick={() => activate(p.duration_days, p.name)}>
                  {p.name} ({p.duration_days}d)
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlansManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: plans } = useQuery({ queryKey: ["plans", "admin"], queryFn: () => fetchPlans(true) });
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    if (plans) setDrafts(plans.map(toDraft));
  }, [plans]);

  const update = (i: number, patch: Partial<Draft>) =>
    setDrafts((d) => d.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const save = async (draft: Draft) => {
    let rules: unknown = {};
    try {
      rules = draft.rulesText.trim() ? JSON.parse(draft.rulesText) : {};
    } catch {
      toast({ variant: "destructive", title: "Regras inválidas", description: "O campo de regras precisa ser um JSON válido." });
      return;
    }
    const payload = {
      name: draft.name,
      description: draft.description,
      price_label: draft.price_label,
      period_label: draft.period_label,
      duration_days: Number(draft.duration_days) || 30,
      badge: draft.badge || null,
      featured: draft.featured,
      whatsapp_message: draft.whatsapp_message,
      features: draft.featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
      rules: rules as never,
      active: draft.active,
      sort_order: Number(draft.sort_order) || 0,
    };
    const res = draft.id
      ? await supabase.from("plans").update(payload).eq("id", draft.id)
      : await supabase.from("plans").insert(payload);
    if (res.error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: res.error.message });
      return;
    }
    toast({ title: "Plano salvo", description: draft.name });
    qc.invalidateQueries({ queryKey: ["plans"] });
  };

  const remove = async (draft: Draft, i: number) => {
    if (draft.id) {
      const { error } = await supabase.from("plans").delete().eq("id", draft.id);
      if (error) {
        toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
        return;
      }
      qc.invalidateQueries({ queryKey: ["plans"] });
    }
    setDrafts((d) => d.filter((_, idx) => idx !== i));
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Gerenciador de planos</CardTitle>
          <CardDescription>Crie e edite planos, mensagens do WhatsApp e regras específicas</CardDescription>
        </div>
        <Button size="sm" onClick={() => setDrafts((d) => [...d, emptyDraft()])}>
          <Plus className="w-4 h-4 mr-1" /> Novo plano
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {drafts.map((draft, i) => (
          <div key={draft.id ?? `new-${i}`} className="rounded-xl border border-border p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Nome</Label>
                <Input value={draft.name} onChange={(e) => update(i, { name: e.target.value })} />
              </div>
              <div>
                <Label>Selo (opcional)</Label>
                <Input value={draft.badge ?? ""} onChange={(e) => update(i, { badge: e.target.value })} />
              </div>
              <div>
                <Label>Preço exibido</Label>
                <Input value={draft.price_label} onChange={(e) => update(i, { price_label: e.target.value })} />
              </div>
              <div>
                <Label>Período exibido</Label>
                <Input value={draft.period_label} onChange={(e) => update(i, { period_label: e.target.value })} />
              </div>
              <div>
                <Label>Duração (dias)</Label>
                <Input
                  type="number"
                  value={draft.duration_days}
                  onChange={(e) => update(i, { duration_days: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => update(i, { sort_order: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Input value={draft.description} onChange={(e) => update(i, { description: e.target.value })} />
            </div>

            <div>
              <Label>Mensagem do WhatsApp</Label>
              <Textarea
                rows={2}
                value={draft.whatsapp_message}
                onChange={(e) => update(i, { whatsapp_message: e.target.value })}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Recursos (um por linha)</Label>
                <Textarea rows={4} value={draft.featuresText} onChange={(e) => update(i, { featuresText: e.target.value })} />
              </div>
              <div>
                <Label>Regras do plano (JSON)</Label>
                <Textarea
                  rows={4}
                  className="font-mono text-xs"
                  value={draft.rulesText}
                  onChange={(e) => update(i, { rulesText: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.active} onChange={(e) => update(i, { active: e.target.checked })} />
                Ativo
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.featured} onChange={(e) => update(i, { featured: e.target.checked })} />
                Destaque
              </label>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={() => remove(draft, i)}>
                <Trash2 className="w-4 h-4 mr-1" /> Excluir
              </Button>
              <Button size="sm" onClick={() => save(draft)}>
                <Save className="w-4 h-4 mr-1" /> Salvar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
