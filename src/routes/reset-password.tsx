import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: ResetPage });

function ResetPage() {
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    navigate({ to: "/app" });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Definir nova senha</h1>
        <div>
          <Label htmlFor="senha">Nova senha</Label>
          <Input id="senha" type="password" minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </div>
        <Button className="w-full" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
      </form>
    </div>
  );
}