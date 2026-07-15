import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listTransacoes, deleteTransacao, updateTransacao } from "@/lib/finance.functions";
import { brl, dateBR, CATEGORIAS_DESPESA, CATEGORIAS_RECEITA } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/historico")({ component: HistoricoPage });

function HistoricoPage() {
  const listT = useServerFn(listTransacoes);
  const delT = useServerFn(deleteTransacao);
  const updT = useServerFn(updateTransacao);
  const qc = useQueryClient();
  const { data: tx = [] } = useQuery({ queryKey: ["transacoes"], queryFn: () => listT() });

  const [tipo, setTipo] = useState<"todos" | "receita" | "despesa">("todos");
  const [cat, setCat] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [editing, setEditing] = useState<any | null>(null);

  const filtered = useMemo(() => {
    return tx.filter((t: any) => {
      if (tipo !== "todos" && t.tipo !== tipo) return false;
      if (cat && t.categoria !== cat) return false;
      if (busca && !`${t.descricao} ${t.categoria}`.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [tx, tipo, cat, busca]);

  async function apagar(id: string) {
    if (!confirm("Excluir esta transação?")) return;
    await delT({ data: { id } });
    qc.invalidateQueries({ queryKey: ["transacoes"] });
    toast.success("Transação excluída");
  }

  async function salvar() {
    if (!editing) return;
    await updT({ data: { id: editing.id, patch: {
      valor: Number(editing.valor),
      categoria: editing.categoria,
      descricao: editing.descricao ?? "",
      data_transacao: editing.data_transacao,
    }}});
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["transacoes"] });
    toast.success("Atualizado");
  }

  return (
    <div className="mx-auto max-w-5xl p-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-semibold text-foreground">Histórico</h1>
      <p className="text-sm text-muted-foreground">Todas as suas movimentações registradas.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="todos">Todos os tipos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="">Todas as categorias</option>
          {[...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <Input placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {filtered.length === 0 && <p className="p-6 text-sm text-muted-foreground">Nenhuma transação encontrada.</p>}
        {filtered.map((t: any) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3">
            <div className={`h-2 w-2 rounded-full ${t.tipo === "receita" ? "bg-emerald-500" : "bg-red-500"}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{t.descricao || t.categoria}</div>
              <div className="text-xs text-muted-foreground">{dateBR(t.data_transacao)} · {t.categoria}</div>
            </div>
            <div className={`text-sm font-semibold ${t.tipo === "receita" ? "text-emerald-600" : "text-red-500"}`}>
              {t.tipo === "receita" ? "+" : "-"} {brl(Number(t.valor))}
            </div>
            <button onClick={() => setEditing({ ...t })} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => apagar(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar transação</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div>
                <Label>Valor</Label>
                <Input type="number" step="0.01" value={editing.valor} onChange={(e) => setEditing({ ...editing, valor: e.target.value })} />
              </div>
              <div>
                <Label>Categoria</Label>
                <select value={editing.categoria} onChange={(e) => setEditing({ ...editing, categoria: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {(editing.tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={editing.descricao ?? ""} onChange={(e) => setEditing({ ...editing, descricao: e.target.value })} />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={String(editing.data_transacao).slice(0,10)} onChange={(e) => setEditing({ ...editing, data_transacao: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}