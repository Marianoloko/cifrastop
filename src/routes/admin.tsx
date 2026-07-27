import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShieldAlert, CheckCircle, Search, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel administrativo · CifraStop" },
      { name: "description", content: "Área restrita para gerenciar assinaturas e acessos dos usuários do CifraStop." },
      { property: "og:title", content: "Painel administrativo · CifraStop" },
      { property: "og:description", content: "Área restrita de gestão de assinaturas do CifraStop." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Credenciais simples de admin (Ajuste conforme necessário)
    if (adminUser === "admin" && adminPass === "cifrastop2026") {
      setIsAdminLoggedIn(true);
      toast({ title: "Acesso autorizado", description: "Painel administrativo liberado." });
    } else {
      toast({ variant: "destructive", title: "Acesso negado", description: "Usuário ou senha inválidos." });
    }
  };

  const handleSearchEmail = async () => {
    setLoading(true);
    setFoundUser(null);

    try {
      // Busca o usuário pelo telefone/WhatsApp cadastrado no perfil
      const { data, error } = await supabase
        .from("profiles")
        .select("id, phone, trial_started_at")
        .eq("phone", searchEmail)
        .maybeSingle();

      if (error || !data) {
        toast({
          variant: "destructive",
          title: "Usuário não encontrado",
          description: "Este telefone ainda não possui cadastro no CifraStop.",
        });
      } else {
        setFoundUser(data);
        toast({ title: "Usuário encontrado!", description: `Telefone: ${data.phone}` });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro na busca", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePlan = async (days: number, planName: string) => {
    if (!foundUser) return;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    try {
      const { error } = await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: foundUser.id,
            status: "active",
            current_period_end: expirationDate.toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (error) throw error;

      toast({
        title: "Plano Ativado com Sucesso!",
        description: `O ${planName} foi liberado para ${foundUser.phone} até ${expirationDate.toLocaleDateString()}.`,
      });

    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao ativar plano", description: err.message });
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-2" />
            <CardTitle>Painel Administrativo</CardTitle>
            <CardDescription>Área restrita para gerenciamento de licenças</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <Label>Usuário Admin</Label>
                <Input value={adminUser} onChange={(e) => setAdminUser(e.target.value)} required />
              </div>
              <div>
                <Label>Senha</Label>
                <Input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">Entrar no Painel</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Painel de Ativação - CifraStop</h1>
        <Button variant="outline" onClick={() => setIsAdminLoggedIn(false)}>Sair</Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Buscar Cliente por Telefone</CardTitle>
          <CardDescription>Digite o telefone/WhatsApp informado no cadastro para liberar o acesso</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input
            placeholder="(98) 98715-0431"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
          />
          <Button onClick={handleSearchEmail} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </CardContent>
      </Card>

      {foundUser && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="text-primary" /> Usuário Selecionado
            </CardTitle>
            <CardDescription>{foundUser.phone}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Escolha o plano que deseja ativar para este cliente:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button onClick={() => handleActivatePlan(30, "Plano Mensal (R$ 15)")}>
                Ativar Mensal (30 dias)
              </Button>
              <Button variant="secondary" onClick={() => handleActivatePlan(90, "Plano Diferenciado (3 Meses)")}>
                Ativar Diferenciado (90 dias)
              </Button>
              <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleActivatePlan(365, "Plano Anual (R$ 120)")}>
                Ativar Anual (365 dias)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
