import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, UserCheck, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { activateAdminCustomerPlan, getAdminStatus, searchAdminCustomer, signInAdmin, signOutAdmin } from "@/lib/admin.functions";

type FoundCustomer = { id: string; email: string | null; phone: string | null } | null;

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo · CifraStop" },
      { name: "description", content: "Área restrita para liberar assinaturas CifraStop." },
      { property: "og:title", content: "Painel administrativo · CifraStop" },
      { property: "og:description", content: "Área restrita para liberar assinaturas CifraStop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
  ssr: false,
});

function AdminPage() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [foundUser, setFoundUser] = useState<FoundCustomer>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const getStatus = useServerFn(getAdminStatus);
  const loginAdmin = useServerFn(signInAdmin);
  const logoutAdmin = useServerFn(signOutAdmin);
  const searchCustomer = useServerFn(searchAdminCustomer);
  const activatePlan = useServerFn(activateAdminCustomerPlan);

  useEffect(() => {
    getStatus().then((status) => setIsAdminLoggedIn(status.unlocked)).catch(() => setIsAdminLoggedIn(false));
  }, [getStatus]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await loginAdmin({ data: { password: adminPass } });
      if (!result.ok) {
        toast({ variant: "destructive", title: "Acesso negado", description: "Senha administrativa incorreta." });
        return;
      }
      setIsAdminLoggedIn(true); setAdminPass("");
      toast({ title: "Acesso autorizado", description: "Painel liberado." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Não foi possível acessar o painel.";
      toast({ variant: "destructive", title: "Erro no painel", description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCustomer = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setFoundUser(null);
    try {
      const data = await searchCustomer({ data: { search: searchTerm.trim() } });
      if (!data) {
        toast({ variant: "destructive", title: "Cliente não localizado", description: "Busque pelo e-mail ou WhatsApp do cadastro." });
      } else {
        setFoundUser(data);
        toast({ title: "Cliente localizado", description: data.email ?? data.phone ?? "Cadastro encontrado" });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Não foi possível buscar o cliente.";
      toast({ variant: "destructive", title: "Erro na consulta", description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePlan = async (days: number, planName: string) => {
    if (!foundUser) return;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    try {
      await activatePlan({ data: { userId: foundUser.id, days, planName } });
      toast({ title: "Acesso liberado", description: `${planName} ativado até ${expirationDate.toLocaleDateString("pt-BR")}.` });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Não foi possível ativar o plano.";
      toast({ variant: "destructive", title: "Erro ao ativar", description: message });
    }
  };

  const handleSignOut = async () => {
    await logoutAdmin();
    setIsAdminLoggedIn(false);
    setFoundUser(null);
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20 shadow-2xl">
          <CardHeader className="text-center">
            <KeyRound className="w-12 h-12 text-primary mx-auto mb-2" />
            <CardTitle className="text-2xl">Painel do Administrador</CardTitle>
            <CardDescription>Área restrita de gestão de licenças CifraStop</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <Label>Senha do painel</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••••••" 
                  value={adminPass} 
                  onChange={(e) => setAdminPass(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full py-5 text-base font-bold" disabled={loading}>
                {loading ? "Validando..." : "Acessar Painel"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold">Painel de Ativação de Clientes</h1>
        <Button variant="outline" onClick={handleSignOut}>Encerrar Sessão</Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pesquisar Cliente</CardTitle>
          <CardDescription>Digite o e-mail ou WhatsApp informado pelo cliente para liberar a licença</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input
            placeholder="cliente@email.com ou WhatsApp"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button onClick={handleSearchCustomer} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? "Buscando..." : "Buscar Cliente"}
          </Button>
        </CardContent>
      </Card>

      {foundUser && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="text-primary" /> Cliente Encontrado
            </CardTitle>
            <CardDescription className="text-foreground font-semibold">{foundUser.email ?? "Sem e-mail salvo"} {foundUser.phone ? `· ${foundUser.phone}` : ""}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground font-medium">Clique no plano pago para liberar o acesso:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button onClick={() => handleActivatePlan(30, "Plano Mensal (R$ 15)")}>
                Ativar Mensal (30 dias)
              </Button>
              <Button variant="secondary" onClick={() => handleActivatePlan(90, "Plano Diferenciado (90 dias)")}>
                Ativar Diferenciado (90 dias)
              </Button>
              <Button onClick={() => handleActivatePlan(365, "Plano Anual (R$ 120)")}>
                Ativar Anual (365 dias)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
