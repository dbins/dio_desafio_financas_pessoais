import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getProfile, updateProfile } from "@/lib/finance.functions";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({ component: Onboarding });

const OPCOES = [
  { v: "economizar", l: "💰 Economizar" },
  { v: "controlar_gastos", l: "📊 Controlar gastos" },
  { v: "sair_das_dividas", l: "🚀 Sair das dívidas" },
  { v: "guardar_dinheiro", l: "🏦 Guardar dinheiro" },
  { v: "outro", l: "✨ Outro" },
] as const;

function Onboarding() {
  const navigate = useNavigate();
  const getP = useServerFn(getProfile);
  const upd = useServerFn(updateProfile);
  useQuery({ queryKey: ["profile"], queryFn: () => getP() });
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  async function finalizar() {
    if (!objetivo) return;
    setLoading(true);
    try {
      await upd({ data: { objetivo_financeiro: objetivo as any, onboarding_completo: true } });
      navigate({ to: "/app" });
    } catch (e: any) {
      toast.error(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> Bem-vindo ao Finance AI
        </div>
        {step === 1 ? (
          <>
            <h1 className="mt-3 text-2xl font-semibold text-foreground">Qual é seu principal objetivo financeiro?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Vamos personalizar sua experiência.</p>
            <div className="mt-6 grid gap-2">
              {OPCOES.map((o) => (
                <button
                  key={o.v}
                  onClick={() => setObjetivo(o.v)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                    objetivo === o.v ? "border-primary bg-primary/5 text-foreground" : "border-border bg-background hover:bg-secondary"
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
            <Button className="mt-6 w-full" disabled={!objetivo} onClick={() => setStep(2)}>
              Continuar
            </Button>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-2xl font-semibold text-foreground">Tudo pronto! 🎉</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Para registrar uma movimentação, abra o <b>Chat</b> e escreva como falaria com um amigo.
            </p>
            <div className="mt-4 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
              Exemplo: <i>"Gastei R$ 30 no mercado"</i>
            </div>
            <Button className="mt-6 w-full" disabled={loading} onClick={finalizar}>
              {loading ? "Salvando..." : "Ir para o app"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}