import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Music2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · CifraVocal Pro" },
      { name: "description", content: "Acesse seu repertório de cifras, afinador, metrônomo e gravador." },
      { property: "og:title", content: "Entrar · CifraVocal Pro" },
      { property: "og:description", content: "Acesse seu repertório de cifras, afinador, metrônomo e gravador." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { phone },
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    navigate({ to: "/app" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    navigate({ to: "/app" });
  };

  const handleGoogle = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError(result.error.message ?? "Erro ao entrar com Google");
    else if (!result.redirected) navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-amber text-white font-bold flex items-center justify-center mx-auto mb-3 chord-mono" style={{ color: "white" }}>
            CV
          </div>
          <h1 className="text-2xl font-bold">CifraVocal Pro</h1>
          <p className="text-sm text-muted-foreground">Kit completo do músico</p>
        </div>

        <div className="rounded-2xl bg-card border border-border shadow-sm p-5 sm:p-6">
          <div className="flex gap-1 p-1 rounded-lg bg-secondary/60 mb-5">
            <TabBtn active={mode === "signup"} onClick={() => setMode("signup")}>Criar conta</TabBtn>
            <TabBtn active={mode === "login"} onClick={() => setMode("login")}>Entrar</TabBtn>
          </div>

          <button
            onClick={handleGoogle}
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-accent py-2.5 text-sm font-medium mb-4"
          >
            <GoogleIcon />
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 my-4 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            ou com email
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={mode === "signup" ? handleSignup : handleLogin} className="space-y-3">
            <FormField label="E-mail">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" />
            </FormField>
            <FormField label="Senha">
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" />
            </FormField>
            {mode === "signup" && (
              <FormField label="Telefone / WhatsApp">
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="auth-input" />
              </FormField>
            )}

            {error && <div className="text-xs text-destructive bg-destructive/10 rounded-lg p-2">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-tom text-white font-semibold py-3 hover:opacity-95 disabled:opacity-50 transition text-sm"
            >
              {loading ? "Aguarde..." : mode === "signup" ? "Criar Conta e Testar Grátis por 2 Horas" : "Entrar"}
            </button>

            {mode === "login" && (
              <div className="text-center">
                <Link to="/reset-password" className="text-xs text-muted-foreground hover:text-foreground">
                  Esqueci minha senha
                </Link>
              </div>
            )}
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4 px-4">
          Ao criar uma conta, você concorda com nossos termos. Após 2h de teste, o acesso passa a R$ 15/mês.
        </p>
      </div>

      <style>{`.auth-input{width:100%;background:var(--secondary);border:1px solid var(--border);border-radius:0.5rem;padding:0.6rem 0.75rem;font-size:0.875rem;outline:none;color:var(--foreground)}.auth-input:focus{border-color:var(--tom)}`}</style>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${active ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
    >
      {children}
    </button>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground block mb-1">{label}</span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.6 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.1 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.3-.4-3.5z"/></svg>
  );
}
