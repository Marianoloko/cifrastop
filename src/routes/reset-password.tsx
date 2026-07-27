import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha · CifraVocal Pro" },
      { name: "description", content: "Recupere o acesso à sua conta CifraVocal Pro." },
      { property: "og:title", content: "Redefinir senha · CifraVocal Pro" },
      { property: "og:description", content: "Recupere o acesso à sua conta CifraVocal Pro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = Route.useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"request" | "update">("request");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("update");
    }
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setMessage(null); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setMessage("Enviamos um email com o link de recuperação.");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setMessage(null); setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(error.message);
    else {
      setMessage("Senha atualizada! Você já pode entrar.");
      window.setTimeout(() => { navigate({ to: "/auth", replace: true }); }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-sm p-6">
        <h1 className="text-xl font-bold mb-1">{mode === "update" ? "Nova senha" : "Redefinir senha"}</h1>
        <p className="text-sm text-muted-foreground mb-4">
          {mode === "update" ? "Escolha uma nova senha para sua conta." : "Digite seu email e enviaremos um link de recuperação."}
        </p>

        <form onSubmit={mode === "update" ? handleUpdate : handleRequest} className="space-y-3">
          {mode === "request" ? (
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="auth-input" />
          ) : (
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha" className="auth-input" />
          )}

          {error && <div className="text-xs text-destructive bg-destructive/10 rounded-lg p-2">{error}</div>}
          {message && <div className="text-xs text-emerald bg-emerald/10 rounded-lg p-2">{message}</div>}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-tom text-white font-semibold py-3 hover:opacity-95 disabled:opacity-50 transition text-sm">
            {loading ? "Aguarde..." : mode === "update" ? "Atualizar senha" : "Enviar link"}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground">← Voltar</Link>
        </div>
      </div>
      <style>{`.auth-input{width:100%;background:var(--secondary);border:1px solid var(--border);border-radius:0.5rem;padding:0.6rem 0.75rem;font-size:0.875rem;outline:none;color:var(--foreground)}.auth-input:focus{border-color:var(--tom)}`}</style>
    </div>
  );
}
