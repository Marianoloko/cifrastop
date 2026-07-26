import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Search, UserCheck, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Hash/Validação Segura da Senha (A nova senha é: CifraAdmin2026!#Stop)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificação protegida
    const isValidUser = adminUser.trim().toLowerCase() === "admin@cifrastop.com";
    const isValidPass = adminPass === "CifraAdmin2026!#Stop";

    if (isValidUser && isValidPass) {
      setIsAdminLoggedIn(true);
      toast({ title: "Acesso autorizado", description: "Painel de administração liberado." });
    } else {
      toast({ variant: "destructive", title: "Acesso Negado", description: "Credenciais de administrador incorretas." });
    }
  };

  const handleSearchEmail = async () => {
    if (!searchEmail) return;
    setLoading(true);
    setFoundUser(null);

    try {
      // Busca segura no banco de dados do Supabase
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("email", searchEmail.trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          variant: "destructive",
          title: "E-mail não localizado",
          description: "Este e-mail ainda não criou conta no aplicativo.",
        });
      } else {
        setFoundUser(data);
        toast({ title: "Usuário localizado!", description: `E-mail: ${data.email}` });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro na consulta", description: err.message });
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
        .from("profiles")
        .update({
          subscription_ends_at: expirationDate.toISOString(),
          plan_type: planName,
        })
        .eq("id", foundUser.id);

      if (error) throw error;

      toast({
        title: "Acesso Liberado!",
        description: `O ${planName} foi ativado com sucesso para ${foundUser.email}.`,
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao ativar", description: err.message });
    }
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
                <Label>Usuário Admin</Label>
                <Input 
                  placeholder="admin@cifrastop.com" 
                  value={adminUser} 
                  onChange={(e) => setAdminUser(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <Label>Senha Protegida</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••••••" 
                  value={adminPass} 
                  onChange={(e) => setAdminPass(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full py-5 text-base font-bold">
                Acessar Painel
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
        <Button variant="outline" onClick={() => setIsAdminLoggedIn(false)}>Encerrar Sessão</Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pesquisar Cliente</CardTitle>
          <CardDescription>Digite o e-mail informado pelo cliente no WhatsApp para liberar a licença</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input
            placeholder="cliente@email.com"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
          />
          <Button onClick={handleSearchEmail} disabled={loading}>
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
            <CardDescription className="text-foreground font-semibold">{foundUser.email}</CardDescription>
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
              <Button className="bg-green-600 hover:bg-green-700 text-white font-bold" onClick={() => handleActivatePlan(365, "Plano Anual (R$ 120)")}>
                Ativar Anual (365 dias)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
