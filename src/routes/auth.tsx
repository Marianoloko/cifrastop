import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Lock, Mail, Phone, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta · CifraStop" },
      { name: "description", content: "Crie sua conta CifraStop e teste grátis por 2 horas." },
      { property: "og:title", content: "Entrar ou criar conta · CifraStop" },
      { property: "og:description", content: "Teste grátis por 2 horas a plataforma completa para músicos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
  ssr: false,
});

async function ensureUserProfile(phone?: string) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      phone: phone?.trim() || (typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null),
    },
    { onConflict: "id" },
  );
}

function friendlyAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "E-mail ou senha incorretos. Se acabou de criar a conta, tente entrar novamente.";
  if (lower.includes("already registered")) return "Este e-mail já tem conta. Use Entrar ou recupere a senha.";
  return message || "Verifique os dados e tente novamente.";
}

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = Route.useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await ensureUserProfile();
        toast({ title: "Bem-vindo de volta!", description: "Login realizado com sucesso." });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { phone: phone.trim() } },
        });
        if (error) throw error;
        await ensureUserProfile(phone);
        toast({ title: "Conta criada com sucesso!", description: "Seu teste grátis de 2 horas foi ativado." });
      }
      await navigate({ to: "/app", replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Verifique se o e-mail/senha estão corretos.";
      toast({ variant: "destructive", title: "Atenção no acesso", description: friendlyAuthError(message) });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
      if (result.redirected) return;
      await ensureUserProfile(phone);
      await navigate({ to: "/app", replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Não foi possível entrar com Google.";
      toast({ variant: "destructive", title: "Erro no Google", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl"><Music className="w-8 h-8 text-primary" /></div>
        <h1 className="text-3xl font-bold text-foreground">CifraStop</h1>
      </div>
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{isLogin ? "Acessar Conta" : "Criar sua Conta"}</CardTitle>
          <CardDescription>{isLogin ? "Entre para continuar" : "Experimente 2 horas de acesso gratuito"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="email" type="email" placeholder="seu@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative"><Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="password" type="password" placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            </div>
            {!isLogin && <div className="space-y-2"><Label htmlFor="phone">Telefone/WhatsApp</Label><div className="relative"><Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="phone" type="tel" placeholder="(98) 98715-0431" className="pl-10" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div></div>}
            <Button type="submit" className="w-full text-base py-5" disabled={loading}>{loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta e Testar Grátis por 2 Horas"}<ArrowRight className="w-4 h-4 ml-2" /></Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />ou<div className="h-px flex-1 bg-border" /></div>
          <Button type="button" variant="outline" className="w-full py-5" disabled={loading} onClick={handleGoogle}>Continuar com Google</Button>
          <div className="mt-6 text-center">
            <Button type="button" variant="link" onClick={() => setIsLogin(!isLogin)} className="text-sm font-medium">{isLogin ? "Ainda não tem conta? Cadastre-se" : "Já possui uma conta? Entre aqui"}</Button>
            {isLogin && <div><Link to="/reset-password" className="text-xs text-muted-foreground hover:text-foreground">Esqueci minha senha</Link></div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}