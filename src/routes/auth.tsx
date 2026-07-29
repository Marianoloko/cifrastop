import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Lock, Mail, Phone, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta · CifraStop" },
      { name: "description", content: "Acesse o CifraStop ou crie sua conta e teste grátis por 4 horas: cifras, afinador, metrônomo e gravador." },
      { property: "og:title", content: "Entrar ou criar conta · CifraStop" },
      { property: "og:description", content: "Acesse o CifraStop ou crie sua conta e teste grátis por 4 horas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: "Bem-vindo de volta!", description: "Login realizado com sucesso." });
        navigate({ to: "/app" });
      } else {
        // Cadastro com teste de 4 horas
        const trialEndDate = new Date();
        trialEndDate.setHours(trialEndDate.getHours() + 2);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              phone: phone,
              trial_ends_at: trialEndDate.toISOString(),
              plan_type: "free_trial",
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Conta criada com sucesso!",
          description: "Você ganhou 4 horas de teste grátis no CifraStop.",
        });
        navigate({ to: "/app" });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro na autenticação",
        description: error.message || "Ocorreu um erro ao tentar entrar.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Music className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">CifraStop</h1>
      </div>

      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{isLogin ? "Acessar Conta" : "Criar sua Conta"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Entre com seu e-mail e senha para continuar"
              : "Cadastre-se para experimentar 4 horas de acesso gratuito!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(98) 98715-0431"
                    className="pl-10"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full text-base py-5" disabled={loading}>
              {loading ? "Aguarde..." : isLogin ? "Entrar" : "Iniciar Teste Grátis (4 horas)"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {isLogin ? "Ainda não tem conta? Cadastre-se" : "Já possui uma conta? Entre aqui"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
