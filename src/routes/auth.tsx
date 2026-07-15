import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  function traduzirErro(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes("invalid login") || m.includes("invalid credentials")) return "Email ou senha inválidos.";
    if (m.includes("user already registered") || m.includes("already registered")) return "Este email já está cadastrado.";
    if (m.includes("password should be at least")) return "A senha deve ter no mínimo 6 caracteres.";
    if (m.includes("unable to validate email") || m.includes("invalid email")) return "Email inválido.";
    if (m.includes("email not confirmed")) return "Email ainda não confirmado.";
    if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    if (m.includes("network") || m.includes("failed to fetch")) return "Falha de conexão. Verifique sua internet.";
    return "Não foi possível concluir. Tente novamente.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password: senha,
          options: { data: { nome } },
        });
        if (error) throw error;
        toast.success("Conta criada! Bem-vindo ao Finance AI.");
        navigate({ to: "/app" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate({ to: "/app" });
      }
    } catch (err: any) {
      toast.error(traduzirErro(err?.message ?? ""));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!email) return toast.error("Digite seu email primeiro.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(traduzirErro(error.message));
    else toast.success("Enviamos um link de recuperação para seu email.");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center gap-2 justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-foreground">Finance AI</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h1 className="text-xl font-semibold text-foreground">
            {mode === "signup" ? "Crie sua conta" : "Entrar"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup" ? "Comece a organizar suas finanças em segundos." : "Bem-vindo de volta ao Finance AI."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : mode === "signup" ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button className="text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
              {mode === "signup" ? "Já tenho conta" : "Criar conta"}
            </button>
            {mode === "signin" && (
              <button className="text-muted-foreground hover:text-foreground" onClick={handleReset}>
                Esqueci a senha
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}