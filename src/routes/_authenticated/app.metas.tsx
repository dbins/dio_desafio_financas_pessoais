import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listMetas, createMeta, updateMeta, deleteMeta, listTransacoes } from "@/lib/finance.functions";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/metas")({ component: MetasPage });

function MetasPage() {
  const listM = useServerFn(listMetas);
  const createM = useServerFn(createMeta);
  const updM = useServerFn(updateMeta);
  const delM = useServerFn(deleteMeta);
  const listT = useServerFn(listTransacoes);
  const qc = useQueryClient();
  const { data: metas = [] } = useQuery({ queryKey: ["metas"], queryFn: () => listM() });
  const { data: tx = [] } = useQuery({ queryKey: ["transacoes"], queryFn: () => listT() });

  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [atual, setAtual] = useState("");
  const [prazo, setPrazo] = useState("");

  const mediaMensal = economiaMediaMensal(tx);

  const criar = useMutation({
    mutationFn: () => createM({ data: {
      nome, valor_objetivo: Number(objetivo), valor_atual: Number(atual || 0),
      prazo: prazo || null,
    }}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["metas"] });
      setOpen(false); setNome(""); setObjetivo(""); setAtual(""); setPrazo("");
      toast.success("Meta criada!");
    },
  });

  return (
    <div className="mx-auto max-w-5xl p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Metas financeiras</h1>
          <p className="text-sm text-muted-foreground">Defina objetivos e acompanhe seu progresso.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova meta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova meta</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Viagem para praia" /></div>
              <div><Label>Valor objetivo (R$)</Label><Input type="number" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} /></div>
              <div><Label>Valor já guardado (R$)</Label><Input type="number" value={atual} onChange={(e) => setAtual(e.target.value)} /></div>
              <div><Label>Prazo (opcional)</Label><Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => criar.mutate()} disabled={!nome || !objetivo}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-4">
        {metas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma meta ainda. Crie a primeira!</p>}
        {metas.map((m: any) => {
          const pct = Math.min(100, (Number(m.valor_atual) / Number(m.valor_objetivo)) * 100);
          const restante = Math.max(0, Number(m.valor_objetivo) - Number(m.valor_atual));
          const mesesPrev = mediaMensal > 0 ? Math.ceil(restante / mediaMensal) : null;
          return (
            <div key={m.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-foreground">{m.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {brl(Number(m.valor_atual))} de {brl(Number(m.valor_objetivo))}
                    {m.prazo && ` · Prazo: ${new Date(m.prazo).toLocaleDateString("pt-BR")}`}
                  </div>
                </div>
                <button onClick={async () => {
                  if (!confirm("Excluir meta?")) return;
                  await delM({ data: { id: m.id } });
                  qc.invalidateQueries({ queryKey: ["metas"] });
                }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              <Progress value={pct} className="mt-3" />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{Math.round(pct)}% concluído</span>
                {mesesPrev !== null && <span>≈ {mesesPrev} {mesesPrev === 1 ? "mês" : "meses"} no ritmo atual</span>}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={async () => {
                  const v = prompt("Adicionar quanto? (R$)");
                  if (!v) return;
                  await updM({ data: { id: m.id, patch: { valor_atual: Number(m.valor_atual) + Number(v) } } });
                  qc.invalidateQueries({ queryKey: ["metas"] });
                }}>+ Depósito</Button>
                {m.status !== "concluida" && pct >= 100 && (
                  <Button size="sm" onClick={async () => {
                    await updM({ data: { id: m.id, patch: { status: "concluida" } } });
                    qc.invalidateQueries({ queryKey: ["metas"] });
                    toast.success("Meta concluída! 🎉");
                  }}>Marcar concluída</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function economiaMediaMensal(tx: any[]): number {
  const map = new Map<string, number>();
  for (const t of tx) {
    const d = new Date(t.data_transacao);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    const delta = t.tipo === "receita" ? Number(t.valor) : -Number(t.valor);
    map.set(k, (map.get(k) ?? 0) + delta);
  }
  const vals = Array.from(map.values());
  if (vals.length === 0) return 0;
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  return Math.max(0, avg);
}