import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { gerarRecomendacoes } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Wand2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/agente")({ component: AgentePage });

function AgentePage() {
  const gerar = useServerFn(gerarRecomendacoes);
  const [texto, setTexto] = useState<string>("");
  const mut = useMutation({
    mutationFn: () => gerar(),
    onSuccess: (res: any) => setTexto(res?.recomendacoes ?? ""),
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  return (
    <div className="mx-auto max-w-3xl p-6 pb-24 md:pb-6">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wand2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Agente Financeiro</h1>
          <p className="text-sm text-muted-foreground">Recomendações personalizadas baseadas nos seus dados reais.</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        {!texto && !mut.isPending && (
          <div className="text-center py-8">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Clique abaixo para gerar uma análise da sua situação atual.</p>
            <Button className="mt-4" onClick={() => mut.mutate()}>Gerar recomendações</Button>
          </div>
        )}
        {mut.isPending && (
          <div className="text-center py-8 text-sm text-muted-foreground">Analisando suas finanças...</div>
        )}
        {texto && (
          <>
            <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{texto}</div>
            <Button className="mt-6" variant="outline" onClick={() => mut.mutate()}>Gerar novamente</Button>
          </>
        )}
      </div>
    </div>
  );
}