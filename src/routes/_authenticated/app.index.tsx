import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listTransacoes, listMetas, getProfile } from "@/lib/finance.functions";
import { brl, dateBR } from "@/lib/format";
import { MessageCircle, ListOrdered, BarChart3, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/app/")({ component: HomePage });

function HomePage() {
  const getT = useServerFn(listTransacoes);
  const getM = useServerFn(listMetas);
  const getP = useServerFn(getProfile);
  const { data: tx = [] } = useQuery({ queryKey: ["transacoes"], queryFn: () => getT() });
  const { data: metas = [] } = useQuery({ queryKey: ["metas"], queryFn: () => getM() });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getP() });

  const now = new Date();
  const mesAtual = tx.filter((t: any) => {
    const d = new Date(t.data_transacao);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const receitas = mesAtual.filter((t: any) => t.tipo === "receita").reduce((s: number, t: any) => s + Number(t.valor), 0);
  const despesas = mesAtual.filter((t: any) => t.tipo === "despesa").reduce((s: number, t: any) => s + Number(t.valor), 0);
  const saldoTotal = tx.reduce((s: number, t: any) => s + (t.tipo === "receita" ? Number(t.valor) : -Number(t.valor)), 0);
  const ultima = tx[0] as any;
  const metaAtiva = metas.find((m: any) => m.status === "ativa") as any;

  return (
    <div className="mx-auto max-w-6xl p-6 pb-24 md:pb-6">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Olá, {profile?.nome?.split(" ")[0] || "por aqui"} 👋</p>
        <h1 className="text-2xl font-semibold text-foreground">Seu resumo financeiro</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saldo atual" value={brl(saldoTotal)} accent="primary" />
        <StatCard label="Receitas do mês" value={brl(receitas)} icon={<ArrowUpRight className="h-4 w-4 text-emerald-600" />} />
        <StatCard label="Despesas do mês" value={brl(despesas)} icon={<ArrowDownRight className="h-4 w-4 text-red-500" />} />
        <StatCard label="Economia do mês" value={brl(receitas - despesas)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Última movimentação</h2>
            <Link to="/app/historico" className="text-xs text-primary hover:underline">Ver histórico</Link>
          </div>
          {ultima ? (
            <div>
              <div className="text-xs text-muted-foreground">{dateBR(ultima.data_transacao)} · {ultima.categoria}</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{ultima.descricao || ultima.categoria}</div>
              <div className={`mt-1 text-xl font-bold ${ultima.tipo === "receita" ? "text-emerald-600" : "text-red-500"}`}>
                {ultima.tipo === "receita" ? "+" : "-"} {brl(Number(ultima.valor))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma movimentação ainda. Vá para o Chat!</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Meta em andamento</h2>
            <Link to="/app/metas" className="text-xs text-primary hover:underline">Ver metas</Link>
          </div>
          {metaAtiva ? (
            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-lg font-semibold text-foreground">{metaAtiva.nome}</div>
                <div className="text-sm text-muted-foreground">
                  {Math.min(100, Math.round((Number(metaAtiva.valor_atual) / Number(metaAtiva.valor_objetivo)) * 100))}%
                </div>
              </div>
              <Progress value={Math.min(100, (Number(metaAtiva.valor_atual) / Number(metaAtiva.valor_objetivo)) * 100)} className="mt-3" />
              <div className="mt-2 text-xs text-muted-foreground">
                {brl(Number(metaAtiva.valor_atual))} / {brl(Number(metaAtiva.valor_objetivo))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Você ainda não criou metas.</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <QuickAction to="/app/chat" icon={MessageCircle} label="Conversar" />
        <QuickAction to="/app/historico" icon={ListOrdered} label="Histórico" />
        <QuickAction to="/app/dashboard" icon={BarChart3} label="Dashboard" />
        <QuickAction to="/app/metas" icon={Target} label="Metas" />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, icon }: { label: string; value: string; accent?: "primary"; icon?: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent === "primary" ? "border-primary/20 bg-primary text-primary-foreground" : "border-border bg-card"}`}>
      <div className={`flex items-center justify-between text-xs ${accent === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {label} {icon}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: any; icon: any; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-medium text-foreground hover:border-primary/40 hover:bg-secondary">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      {label}
    </Link>
  );
}